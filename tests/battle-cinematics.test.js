import { IDBFactory } from 'fake-indexeddb'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { heroes } from '../src/game/content/heroes.js'
import { heroVisuals } from '../src/game/content/visual-themes.js'
import { playBattle, startBattle } from '../src/game/core/battle.js'
import {
  applyCommand,
  initialSave,
  newProgress,
} from '../src/game/core/session.js'
import {
  battleSequence,
  heroScene,
  jackpotLine,
  statusChanges,
  victoryScene,
} from '../src/modules/Battle/cinematic.js'
import { createIndexedStorage } from '../src/services/indexed-storage.js'

const zero = () => 0
const high = () => 0.99
const stages = (steps) => steps.map(({ stage }) => stage)

describe('Battle presentation', () => {
  it.each(Object.keys(heroes))(
    'uses %s’s own assets and the engine’s jackpot match',
    (id) => {
      const hero = heroes[id]
      const visuals = heroVisuals[id]
      const progress = newProgress(hero)
      const before = startBattle(hero, progress, 'dragon', high)
      const after = playBattle(before, hero, progress, 'spin', null, zero)
      const scene = heroScene(hero, visuals)

      expect(after.cinematic).toBe(true)
      expect(jackpotLine(after, hero.jackpot)?.symbol).toBe(hero.jackpot.symbol)
      expect(scene.effect).toBe(visuals.effects.jackpot)
      for (const asset of [scene.relic, scene.sigil].filter(Boolean)) {
        const image = visuals.symbols[asset]?.image
        expect(image).toContain(`/symbols/${id}/`)
        expect(existsSync(new URL(`../public${image}`, import.meta.url))).toBe(
          true
        )
      }
      expect(stages(battleSequence(before, after, true, false, false))).toEqual(
        ['spin', 'anticipation', 'cinematic', 'impact', 'recovery', 'phase']
      )
      expect(battleSequence(before, after, true, true, false)).toEqual([])
      expect(battleSequence(after, after, true, false, false)).toEqual([])
    }
  )

  it('plays boss victories and skips the portrait cutaway for ordinary victories', () => {
    const hero = heroes.thorin
    const progress = newProgress(hero)
    const before = {
      ...startBattle(hero, progress, 'dragon', high),
      phase: 2,
      enemyHp: 1,
    }
    const normal = playBattle(before, hero, progress, 'spin', null, high)
    const jackpot = playBattle(before, hero, progress, 'spin', null, zero)
    expect(normal.result).toBe('win')
    expect(normal.cinematic).toBe(false)
    expect(jackpot.result).toBe('win')
    expect(jackpot.feedback.attack).toBe(1)
    expect(stages(battleSequence(before, normal, true, false, false))).toEqual([
      'spin',
      'impact',
      'recovery',
      'victory',
    ])
    expect(stages(battleSequence(before, normal, false, false, false))).toEqual([
      'spin',
      'impact',
      'recovery',
    ])
    expect(stages(battleSequence(before, jackpot, false, false, false))).toContain('cinematic')
    expect(stages(battleSequence(before, jackpot, false, false, false))).not.toContain('victory')
    const desktop = battleSequence(before, jackpot, true, false, false)
    const mobile = battleSequence(before, jackpot, true, false, true)
    expect(stages(desktop)).toEqual([
      'spin',
      'anticipation',
      'cinematic',
      'impact',
      'recovery',
      'victory',
    ])
    expect(stages(mobile)).toEqual(stages(desktop))
    expect(mobile.at(-1).duration).toBeLessThan(desktop.at(-1).duration)
    expect(victoryScene('dragon').style).toBe('embers')
    expect(victoryScene('balrog').style).toBe('fracture')
    expect(victoryScene('azog').style).toBe('iron')
    expect(statusChanges({ weaken: 1, lock: 2 }, { lock: 1, burn: 2 })).toEqual(
      [
        { id: 'weaken', duration: 0 },
        { id: 'burn', duration: 2 },
      ]
    )
  })
})

describe('Cinematic saves', () => {
  it('finishes a reloaded lethal jackpot once even with duplicated commands and reward clicks', async () => {
    const save = applyCommand(initialSave(), { type: 'select', id: 'thorin' })
    const hero = heroes.thorin
    const chapter = hero.route.indexOf('erebor')
    const choice = `thorin-${chapter}.choice`
    const battle = `thorin-${chapter}.battle`
    const reward = `thorin-${chapter}.reward`
    Object.assign(save.heroes.thorin, {
      location: 'erebor',
      chapter,
      node: choice,
      checkpoint: choice,
    })
    const command = (node, type, payload) => ({
      hero: 'thorin',
      node,
      type,
      ...payload,
    })
    const started = applyCommand(
      save,
      command(choice, 'choose', { action: 'battle' }),
      high
    )
    Object.assign(started.heroes.thorin.event, { phase: 2, enemyHp: 1 })
    const factory = new IDBFactory()
    const storage = createIndexedStorage(factory)
    await storage.replace(started)
    const spin = command(battle, 'play', { action: 'spin', turn: 0 })
    const hit = await storage.update((current) =>
      applyCommand(current, spin, zero)
    )
    expect(hit.heroes.thorin.event).toMatchObject({
      turn: 1,
      enemyHp: 0,
      result: 'win',
      cinematic: true,
    })
    expect(
      await storage.update((current) => applyCommand(current, spin, zero))
    ).toEqual(hit)

    const reload = createIndexedStorage(factory)
    expect(await reload.load()).toEqual(hit)
    const advance = command(battle, 'advance')
    const blocked = await reload.update((current) =>
      applyCommand(current, advance)
    )
    expect(blocked.heroes.thorin.node).toBe(battle)
    const dismiss = command(battle, 'play', { action: 'dismiss', turn: 1 })
    const dismissed = await reload.update((current) =>
      applyCommand(current, dismiss)
    )
    expect(dismissed.heroes.thorin.event).toEqual({
      ...hit.heroes.thorin.event,
      cinematic: false,
    })
    expect(
      await reload.update((current) => applyCommand(current, dismiss))
    ).toEqual(dismissed)
    const finished = await reload.update((current) =>
      applyCommand(current, advance)
    )
    expect(
      await reload.update((current) => applyCommand(current, advance))
    ).toEqual(finished)
    expect(finished.heroes.thorin.node).toBe(reward)

    const claim = command(reward, 'advance')
    await Promise.all([
      storage.update((current) => applyCommand(current, claim)),
      reload.update((current) => applyCommand(current, claim)),
    ])
    const final = await reload.load()
    expect(final.coins).toBe(28)
    expect(final.heroes.thorin.xp).toBe(62)
    expect(
      final.heroes.thorin.claimed.filter((id) => id === reward)
    ).toHaveLength(1)
  })
})
