import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { heroes } from '../src/game/content/heroes.js'
import {
  heroVisuals,
  resolveLocationVisuals,
  resolveTrialVisuals,
  resolveVisuals,
  symbolFallback,
} from '../src/game/content/visual-themes.js'
import { playBattle, startBattle } from '../src/game/core/battle.js'
import { newProgress } from '../src/game/core/session.js'
import { isReelFixed } from '../src/game/minigames/slots.js'
import { shouldAnimateTurn } from '../src/hooks/useTurnAnimation.js'
import {
  buildReelStrip,
  reelDuration,
} from '../src/modules/Battle/Reels/motion.js'
import {
  cardArrival,
  cardArrivalDelay,
  dealerRevealTime,
  getDealDuration,
  getRevealDelay,
} from '../src/modules/Trials/Blackjack/motion.js'

const hasImage = (url) =>
  existsSync(new URL(`../public${url}`, import.meta.url))

describe('Visual identity', () => {
  it('provides every hero with an individual set of glyphs, frames and scenes', () => {
    const selected = ['frodo', 'legolas', 'thorin', 'gandalf', 'sauron']
    expect(new Set(selected.map((id) => heroVisuals[id].frame)).size).toBe(5)
    expect(
      new Set(selected.map((id) => heroVisuals[id].effects.jackpot)).size
    ).toBe(5)
    expect(hasImage(symbolFallback)).toBe(true)
    for (const hero of Object.values(heroes)) {
      const theme = heroVisuals[hero.id]
      expect(Object.keys(theme.symbols)).toHaveLength(
        hero.slotConfig.pool.length
      )
      expect(theme.symbols[theme.jackpotSymbol].rarity).toBe('signature')
      expect(
        Object.values(theme.symbols).every(({ image }) => hasImage(image))
      ).toBe(true)
      expect(
        hero.route.every((location) => {
          const { image } = resolveVisuals(hero, location, {})
          return image === null ? ['fangorn', 'doom'].includes(location) : hasImage(image)
        })
      ).toBe(true)
    }
  })

  it('uses the actual Trollshaws and Rivendell scenery, with neutral fallbacks for missing places', () => {
    const forest = resolveLocationVisuals('hobbit', 'trollshaws')
    const valley = resolveLocationVisuals('hobbit', 'rivendell')
    expect(forest.image).toBe('/art/locations/trollshaws.webp')
    expect(valley.image).toBe('/art/locations/rivendell.webp')
    expect(resolveLocationVisuals('hobbit', 'rivendell', { visual: 'moonLetters' }))
      .toMatchObject({ image: valley.image, light: 'cold' })
    expect(resolveLocationVisuals('war', 'fangorn').image).toBeNull()
    expect(resolveLocationVisuals('war', 'doom').image).toBeNull()
  })

  it('keeps Sauron’s obsidian gear in Eregion and varies the atmosphere by campaign and event', () => {
    const er = resolveVisuals(heroes.sauron, 'eregion', {})
    expect(er.image).toContain('eregion')
    expect(er.theme.frame).toBe('obsidian')
    expect(er.table).toBe('elven')
    expect(resolveVisuals(heroes.frodo, 'moria', {}).image).not.toBe(
      resolveVisuals(heroes.durin, 'khazad', {}).image
    )
    expect(resolveVisuals(heroes.frodo, 'rivendell', {}).light).not.toBe(
      resolveVisuals(heroes.bilbo, 'rivendell', {}).light
    )
    expect(
      resolveVisuals(heroes.frodo, 'rivendell', { side: true }).table
    ).toBe('tavern')
    expect(resolveVisuals(heroes.sauron, 'eregion', { boss: true }).boss).toBe(
      true
    )
  })

  it.each(['dice', 'blackjack'])(
    'uses the same table materials for every hero in %s',
    (type) => {
      const node = { type }
      const frodo = resolveTrialVisuals(heroes.frodo.campaignId, 'bree', node)
      const gandalf = resolveTrialVisuals(
        heroes.gandalf.campaignId,
        'bree',
        node
      )
      const elven = resolveTrialVisuals(
        heroes.gandalf.campaignId,
        'rivendell',
        node
      )

      expect(frodo).toEqual(gandalf)
      expect(frodo).toMatchObject({
        table: 'tavern',
        theme: { material: 'wood' },
      })
      expect(elven).toMatchObject({
        table: 'elven',
        theme: { material: 'silver' },
      })
    }
  )
})

describe('Animation timing', () => {
  it('lets the last opening card land and flip before showing a natural blackjack result', () => {
    const before = { player: [], dealer: [], result: null }
    const after = { player: ['A', 'K'], dealer: ['4', '6'], result: 'win' }
    const landing = cardArrivalDelay(before, after, true, 1) + cardArrival
    expect(getRevealDelay(before, after)).toBe(landing)
    expect(getDealDuration(before, after)).toBeGreaterThan(landing + dealerRevealTime)
  })

  it('starts and lands each reel on its exact respective engine column', () => {
    const hero = heroes.legolas
    const progress = newProgress(hero)
    const previous = startBattle(hero, progress, 'vanguard', () => 0.62)
    const next = playBattle(previous, hero, progress, 'spin', null, () => 0.01)
    for (let column = 0; column < 5; column++) {
      const start = previous.grid[column]
      const result = next.grid[column]
      const { symbols, initialRow, landingRow } = buildReelStrip(
        start,
        result,
        hero.slotConfig.pool,
        column,
        next.turn
      )
      expect(symbols.slice(initialRow, initialRow + 3)).toEqual(start)
      expect(symbols.slice(landingRow, landingRow + 3)).toEqual(result)
      if (column)
        expect(reelDuration(column)).toBeGreaterThan(reelDuration(column - 1))
    }
  })

  it('does not replay a hydrated turn and respects reduced motion for jumps', () => {
    expect(shouldAnimateTurn(4, 4, false, false)).toBe(false)
    expect(shouldAnimateTurn(4, 5, false, false)).toBe(true)
    expect(shouldAnimateTurn(4, 6, false, false)).toBe(false)
    expect(shouldAnimateTurn(0, 8, true, false)).toBe(true)
    expect(shouldAnimateTurn(0, 8, true, true)).toBe(false)
  })

  it('alternates the initial deal, animates only new hits and waits for the dealer reveal', () => {
    const empty = { player: [], dealer: [], result: null }
    const opening = { player: ['a', 'b'], dealer: ['c', 'd'], result: null }
    expect([
      cardArrivalDelay(empty, opening, false, 0),
      cardArrivalDelay(empty, opening, true, 0),
      cardArrivalDelay(empty, opening, false, 1),
      cardArrivalDelay(empty, opening, true, 1),
    ]).toEqual([0, 115, 230, 345])
    const hit = { ...opening, player: [...opening.player, 'e'] }
    expect(cardArrivalDelay(opening, hit, false, 0)).toBeNull()
    expect(cardArrivalDelay(opening, hit, false, 2)).toBe(0)
    const stand = { ...hit, result: 'win', dealer: [...hit.dealer, 'f'] }
    expect(cardArrivalDelay(hit, stand, true, 2)).toBe(dealerRevealTime)
    expect(getDealDuration(hit, stand)).toBeGreaterThan(
      dealerRevealTime + cardArrival
    )
  })
})

describe('Combat feedback', () => {
  it('does not spend Focus on a locked reel and never converts disrupted columns', () => {
    const hero = heroes.sauron
    const progress = newProgress(hero)
    const battle = {
      ...startBattle(hero, progress, 'wardens', () => 0.74),
      focus: 8,
      held: [0],
      statuses: { lock: 2, shift: 2 },
    }
    expect(isReelFixed(2, battle.held, battle.statuses)).toBe(true)
    expect(playBattle(battle, hero, progress, 'hold', 2)).toBe(battle)
    const changed = playBattle(battle, hero, progress, 'convert')
    expect(changed.held).toEqual([0, 1])
    expect(changed.grid[1][1]).toBe(hero.slotConfig.pool[1].id)
    expect(changed.grid[2]).toEqual(battle.grid[2])
    expect(changed.grid[4]).toEqual(battle.grid[4])
  })

  it('records actual critical damage once and does not change it when skipping the cinematic', () => {
    const hero = heroes.legolas
    const progress = newProgress(hero)
    const start = startBattle(hero, progress, 'vanguard', () => 0.97)
    const triggered = playBattle(start, hero, progress, 'spin', null, () => 0)
    expect(triggered).toMatchObject({
      cinematic: true,
      feedback: { revision: 1, critical: true, phaseChanged: true },
    })
    expect(triggered.feedback.attack).toBe(start.enemyHp - triggered.enemyHp)
    const restored = JSON.parse(JSON.stringify(triggered))
    const skipped = playBattle(restored, hero, progress, 'dismiss')
    expect(skipped).toEqual({ ...triggered, cinematic: false })
    expect(playBattle(skipped, hero, progress, 'dismiss')).toBe(skipped)
  })
})
