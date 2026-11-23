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
import { playDice, scoreDice, startDice } from '../src/game/minigames/dice.js'
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

describe('Dice', () => {
  it.each([
    [[2, 2, 2, 2, 2], 'five', 40],
    [[4, 4, 4, 4, 1], 'four', 35],
    [[4, 4, 4, 2, 2], 'house', 31],
    [[6, 2, 4, 3, 5], 'straight', 36],
    [[3, 3, 3, 2, 1], 'three', 21],
    [[1, 1, 5, 5, 6], 'twoPair', 25],
    [[1, 1, 3, 4, 6], 'pair', 19],
    [[1, 2, 3, 4, 6], 'high', 16],
  ])('scores %j as %s', (dice, combination, score) => {
    expect(scoreDice(dice)).toEqual({ combination, score })
  })

  it('preserves held dice, limits rerolls and applies a story modifier', () => {
    let game = startDice(2)
    expect(game).toMatchObject({ dice: [], rolls: 3, result: null })
    expect(playDice(game, 'hold', 2)).toBe(game)
    expect(playDice(game, 'score')).toBe(game)
    game = playDice(game, 'roll', null, zero)
    expect(game).toMatchObject({
      dice: [1, 1, 1, 1, 1],
      rolls: 2,
      result: null,
    })
    game = playDice(game, 'hold', 2)
    game = playDice(game, 'roll', null, high)
    expect(game).toMatchObject({ dice: [6, 6, 1, 6, 6], held: [2], rolls: 1 })
    game = playDice(game, 'roll', null, high)
    expect(playDice(game, 'roll')).toBe(game)
    expect(playDice(game, 'score')).toMatchObject({
      result: 'win',
      score: 45,
      combination: 'four',
    })
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
})
