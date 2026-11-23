import { describe, expect, it } from 'vitest'

import { heroes } from '../src/game/content/heroes.js'
import { playBattle, startBattle } from '../src/game/core/battle.js'
import { newProgress } from '../src/game/core/session.js'
import {
  blackjackOutcome,
  deal,
  handValue,
  makeDeck,
  natural,
  playBlackjack,
  startBlackjack,
} from '../src/game/minigames/blackjack.js'
import {
  duelTotals, playDice, startDice, sumDice
} from '../src/game/minigames/dice.js'
import {
  findCombinations,
  generateGrid,
  spinEffects,
} from '../src/game/minigames/slots.js'

const zero = () => 0
const high = () => 0.99
const hand = (...ranks) => ranks.map((rank) => ({ rank, suit: '♠' }))

describe('Blackjack', () => {
  it('waits for a manual deal and deals only once', () => {
    const ready = startBlackjack()
    expect(ready).toEqual({ player: [], dealer: [], deck: [], result: null })
    expect(playBlackjack(ready, 'hit')).toBe(ready)
    expect(playBlackjack(ready, 'stand')).toBe(ready)
    const dealt = playBlackjack(ready, 'deal', zero)
    expect(dealt).toEqual(deal(zero))
    expect(playBlackjack(dealt, 'deal', high)).toBe(dealt)
  })

  it('shuffles a full deck and deals two cards to each side', () => {
    const deck = makeDeck(zero)
    expect(new Set(deck.map(({ rank, suit }) => rank + suit)).size).toBe(52)
    expect(deck).not.toEqual(makeDeck(high))
    expect(deal(zero)).toMatchObject({
      player: deck.filter((_, index) => [0, 2].includes(index)),
      dealer: [deck[3], deck[1]],
      deck: deck.slice(4),
    })
  })

  it('reduces multiple aces and distinguishes a natural from a three-card 21', () => {
    expect(handValue(hand('A', 'A', '9'))).toBe(21)
    expect(handValue(hand('A', 'A', '9', 'K'))).toBe(21)
    expect(handValue(hand('A', 'K', 'K', '2'))).toBe(23)
    expect(natural(hand('A', 'K'))).toBe(true)
    expect(natural(hand('A', '5', '5'))).toBe(false)
    expect(blackjackOutcome(hand('A', '5', '5'), hand('A', 'K'))).toBe('loss')
    expect(blackjackOutcome(hand('A', 'K'), hand('A', 'Q'))).toBe('draw')
  })

  it('draws the dealer to 17 and resolves stand, hit and bust', () => {
    const match = {
      player: hand('K', '8'),
      dealer: hand('4', 'K'),
      deck: hand('3', '8'),
      result: null,
    }
    expect(playBlackjack(match, 'stand')).toMatchObject({
      result: 'win',
      dealer: hand('4', 'K', '3'),
    })
    expect(playBlackjack(match, 'hit')).toMatchObject({
      result: 'win',
      player: hand('K', '8', '3'),
      dealer: hand('4', 'K', '8'),
    })
    expect(playBlackjack({ ...match, deck: hand('9') }, 'hit').result).toBe(
      'loss'
    )
    expect(blackjackOutcome(hand('K', '8'), hand('Q', '8'))).toBe('draw')
  })
})

describe('Dice Duel', () => {
  const round = (game, player, opponent) => {
    let calls = 0
    return playDice(playDice(game, 'next'), 'roll', () => calls++ < 5 ? player : opponent)
  }

  it('sums ordinary faces and caps a round at 30', () => {
    expect(sumDice([1, 2, 3, 4, 6])).toBe(16)
    expect(sumDice([6, 6, 6, 6, 6])).toBe(30)
  })

  it.each([[0.99, 0, 'win'], [0, 0.99, 'loss']])(
    'compares three rounds and returns %s against %s as %s',
    (player, opponent, result) => {
      let game = startDice()
      for (let index = 0; index < 3; index++) {
        game = round(game, player, opponent)
        expect(game.result).toBe(index === 2 ? result : null)
        expect(playDice(game, 'roll')).toBe(game)
      }
      expect(duelTotals(game.rounds)).toEqual({
        player: result === 'win' ? 90 : 15,
        opponent: result === 'win' ? 15 : 90,
      })
      expect(playDice(game, 'next')).toBe(game)
    }
  )

  it('keeps playing tiebreaks until a round breaks the cumulative tie', () => {
    let game = round(startDice(), 0.99, 0)
    game = round(game, 0, 0.99)
    game = round(game, 0.5, 0.5)
    expect(game).toMatchObject({ ready: false, result: null })
    game = round(game, 0.25, 0.25)
    expect(game.rounds).toHaveLength(4)
    expect(game.result).toBeNull()
    game = round(game, 0.99, 0)
    expect(game.rounds).toHaveLength(5)
    expect(game.result).toBe('win')
  })
})

describe('Slots and combat', () => {
  const hero = heroes.legolas
  const progress = newProgress(hero)

  it('generates a deterministic 5 by 3 grid with hold and boss disruption', () => {
    const grid = generateGrid(hero.slotConfig.pool, zero)
    expect(grid).toEqual(Array.from({ length: 5 }, () => ['bow', 'bow', 'bow']))
    const changed = generateGrid(hero.slotConfig.pool, high, grid, [0], {
      lock: 2,
      shift: 2,
    })
    expect(changed[0]).toEqual(grid[0])
    expect(changed[2]).toEqual(grid[2])
    expect(changed[3]).toEqual(['star', 'star', 'star'])
    expect(changed[4]).toEqual(['arrows', 'arrows', 'arrows'])
  })

  it('recognizes a signature run even if it starts in the third column', () => {
    const grid = [
      ['leaf', 'leaf', 'leaf'],
      ['star', 'star', 'star'],
      ['arrows', 'bow', 'arrows'],
      ['leaf', 'bow', 'leaf'],
      ['star', 'bow', 'star'],
    ]
    expect(findCombinations(grid)).toContainEqual({
      symbol: 'bow',
      count: 3,
      line: 0,
      cells: ['2:1', '3:1', '4:1'],
    })
    expect(spinEffects(findCombinations(grid), hero)).toMatchObject({
      jackpot: true,
      effects: { damage: 7 },
    })
  })

  it('keeps a fresh boss alive after a jackpot and applies its phase exactly once', () => {
    const battle = startBattle(hero, progress, 'vanguard', high)
    const next = playBattle(battle, hero, progress, 'spin', null, zero)
    expect(next).toMatchObject({
      cinematic: true,
      phase: 1,
      statuses: { lock: 2 },
      result: null,
    })
    expect(next.enemyHp).toBeLessThan(battle.enemyHp)
    const closed = playBattle(next, hero, progress, 'dismiss')
    expect(closed).toEqual({ ...next, cinematic: false })
    expect(playBattle(closed, hero, progress, 'dismiss')).toBe(closed)
  })

  it('charges Focus, sets ability cooldown, preserves HP on a quick spin and grants Focus on ordinary turns', () => {
    const base = { ...startBattle(hero, progress, 'vanguard', high), focus: 8 }
    const held = playBattle(base, hero, progress, 'hold', 0)
    expect(held).toMatchObject({ focus: 6, held: [0] })
    const guarded = playBattle(held, hero, progress, 'guard')
    expect(guarded).toMatchObject({ focus: 4, shield: 12 })
    const used = playBattle(guarded, hero, progress, 'ability', null, high)
    expect(used).toMatchObject({ focus: 0, cooldown: 3 })
    expect(playBattle(used, hero, progress, 'ability')).toBe(used)
    const normal = playBattle(base, hero, progress, 'spin', null, high)
    const quick = playBattle(base, hero, progress, 'reroll', null, high)
    expect(normal.focus).toBeGreaterThan(base.focus)
    expect(quick).toMatchObject({ focus: 5, hp: base.hp })
  })
  it('applies weakness to the enemy, a boss curse to the hero and removes expired statuses', () => {
    const wizard = heroes.gandalf
    const state = newProgress(wizard)
    const base = { ...startBattle(wizard, state, 'wrath', high), focus: 6 }
    const cast = playBattle(base, wizard, state, 'ability', null, high)
    expect(cast.statuses).toEqual({ weaken: 2 })
    const ordinary = () => 0.45
    const normal = playBattle(base, wizard, state, 'spin', null, ordinary)
    const weakened = playBattle({ ...base, statuses: { weaken: 1 } }, wizard, state, 'spin', null, ordinary)
    const cursed = playBattle({ ...base, statuses: { curse: 1 } }, wizard, state, 'spin', null, ordinary)
    expect(weakened.log).toEqual({ attack: normal.log.attack, damage: normal.log.damage - 5 })
    expect(cursed.log).toEqual({ attack: normal.log.attack - 3, damage: normal.log.damage })
    expect(weakened.statuses).not.toHaveProperty('weaken')
    expect(cursed.statuses).not.toHaveProperty('curse')
  })

  it('reports actual HP lost on lethal damage and clamps absorbed damage', () => {
    const base = startBattle(hero, progress, 'scout', high)
    const killed = playBattle({ ...base, hp: 1 }, hero, progress, 'spin', null, high)
    expect(killed).toMatchObject({ hp: 0, result: 'loss', log: { damage: 1 }, feedback: { damage: 1 } })
    const blocked = playBattle({ ...base, shield: 40 }, hero, progress, 'spin', null, high)
    expect(blocked.hp).toBe(base.hp)
    expect(blocked.log.damage).toBe(0)
    expect(blocked.shield).toBeLessThan(40)
  })

})
