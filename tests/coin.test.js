import { IDBFactory } from 'fake-indexeddb'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  coinThemes,
  resolveCoinTheme,
} from '../src/game/content/coin-themes.js'
import { heroes } from '../src/game/content/heroes.js'
import { stories } from '../src/game/content/stories.js'
import {
  applyCommand,
  initialSave,
  sceneFor,
  trialTurn,
} from '../src/game/core/session.js'
import { chapterReward, getNode } from '../src/game/core/story.js'
import { nextReward, trialOutcome } from '../src/game/core/trials.js'
import { coinScore, playCoin, startCoin } from '../src/game/minigames/coin.js'
import { shouldAnimateTurn } from '../src/hooks/useTurnAnimation.js'
import { createIndexedStorage } from '../src/services/indexed-storage.js'
import { validateSave } from '../src/services/save-schema.js'

const thorin = heroes.thorin
const select = (save, id) => applyCommand(save, { type: 'select', id })
const progress = (save) => save.heroes.thorin
const node = (save) => getNode(thorin, progress(save))
const command = (save, type, props) => ({
  type,
  hero: thorin.id,
  node: node(save).id,
  ...props,
})
const act = (save, type, props, random) =>
  applyCommand(save, command(save, type, props), random)
const fixture = (location, stage = 'choice') => {
  const save = select(initialSave(), thorin.id)
  const chapter = thorin.route.indexOf(location)
  Object.assign(progress(save), {
    chapter,
    location,
    node: `thorin-${chapter}.${stage}`,
    checkpoint: `thorin-${chapter}.choice`,
  })
  return save
}
const event = (save) =>
  node(save).side ? progress(save).side.game : progress(save).event
const toss = (save, action, random) =>
  act(
    save,
    'play',
    {
      action,
      turn: trialTurn('coin', event(save)),
    },
    random
  )

describe('Fate’s Coin', () => {
  it('samples exactly once and places 0.5 on the tails half', () => {
    let samples = 0
    const heads = playCoin(startCoin(), 'heads', () => {
      samples++
      return 0.49999
    })
    const tails = playCoin(heads, 'heads', () => {
      samples++
      return 0.5
    })
    expect(tails.rounds).toEqual([
      { guess: 'heads', face: 'heads' },
      { guess: 'heads', face: 'tails' },
    ])
    expect(samples).toBe(2)
    expect(coinScore(tails.rounds)).toEqual({ player: 1, opponent: 1 })
    expect(
      playCoin(tails, 'roll', () => {
        throw new Error('Invalid call sampled RNG')
      })
    ).toBe(tails)
  })

  it.each([
    [[0, 0], 'win', { player: 2, opponent: 0 }],
    [[0, 0.9, 0], 'win', { player: 2, opponent: 1 }],
    [[0.9, 0.9], 'loss', { player: 0, opponent: 2 }],
    [[0.9, 0, 0.9], 'loss', { player: 1, opponent: 2 }],
  ])(
    'ends the match for tosses %j without accepting an extra action',
    (values, result, score) => {
      const event = values.reduce(
        (state, value) => playCoin(state, 'heads', () => value),
        startCoin()
      )
      expect(event.result).toBe(result)
      expect(event.rounds).toHaveLength(values.length)
      expect(coinScore(event.rounds)).toEqual(score)
      expect(
        playCoin(event, 'tails', () => {
          throw new Error('Final game sampled RNG')
        })
      ).toBe(event)
    }
  )

  it('defines two existing reliefs for each region plus a fallback', () => {
    expect(
      new Set(Object.values(coinThemes).map(({ heads }) => heads)).size
    ).toBe(7)
    for (const { heads, tails } of Object.values(coinThemes)) {
      expect(heads).not.toBe(tails)
      for (const art of [heads, tails])
        expect(existsSync(new URL(`../public${art}`, import.meta.url))).toBe(
          true
        )
    }
    expect(resolveCoinTheme('lake')).toBe(coinThemes.erebor)
    expect(resolveCoinTheme('minas')).toBe(coinThemes.gondor)
    expect(resolveCoinTheme('unknown')).toBe(coinThemes.fallback)
  })
})

describe('Challenge selection and storage', () => {
  it('opens compulsory bosses directly and rejects an unavailable minigame', () => {
    for (const [place, enemy] of [
      ['erebor', 'dragon'],
      ['five', 'azog'],
      ['mirkwood', 'spider'],
    ]) {
      const choices = fixture(place)
      expect(node(choices).actions.map(({ game }) => game)).toEqual(['battle'])
      expect(act(choices, 'choose', { action: 'coin' })).toBe(choices)
      const save = act(fixture(place, 'dialogue'), 'advance')
      expect(node(save)).toMatchObject({ type: 'battle', enemy, boss: true })
      expect(event(save).turn).toBe(0)
      expect(validateSave(save)).toEqual(save)
    }
    const valley = fixture('rivendell')
    expect(act(valley, 'choose', { action: 'coin' })).toBe(valley)
  })

  it('offers three different Lake-town games and locks the selection once started', () => {
    const save = fixture('lake')
    expect(
      node(save)
        .actions.filter(({ game }) => game)
        .map(({ game }) => game)
    ).toEqual(['blackjack', 'dice', 'coin'])
    for (const game of ['blackjack', 'dice', 'coin']) {
      const selected = act(save, 'choose', { action: game })
      expect(sceneFor(node(selected))).toBe(game)
      expect(validateSave(selected)).toEqual(selected)
      expect(act(selected, 'choose', { action: 'coin' })).toBe(selected)
      expect(act(selected, 'advance')).toBe(selected)
    }
    expect(act(save, 'choose', { action: 'negotiate' })).toBe(save)
  })

  it('persists the result before animation, rejects a duplicate call and restores it across hero changes', async () => {
    const db = new IDBFactory()
    const store = createIndexedStorage(db)
    const started = await store.replace(
      act(fixture('lake'), 'choose', { action: 'coin' })
    )
    const call = command(started, 'play', { action: 'heads', turn: 0 })
    const thrown = await store.update((save) =>
      applyCommand(save, call, () => 0.7)
    )
    const reloaded = createIndexedStorage(db)
    expect(
      await reloaded.update((save) => applyCommand(save, call, () => 0))
    ).toEqual(thrown)
    expect(await reloaded.load()).toEqual(thrown)
    expect(event(thrown).rounds).toEqual([{ guess: 'heads', face: 'tails' }])
    expect(shouldAnimateTurn(1, 1, false, false)).toBe(false)
    expect(shouldAnimateTurn(0, 1, false, true)).toBe(false)
    await reloaded.update((save) => select(save, 'frodo'))
    const back = await reloaded.update((save) => select(save, thorin.id))
    expect(progress(back)).toEqual(progress(thrown))
  })

  it.each([
    [0, 'win', 8],
    [0.99, 'loss', 4],
  ])(
    'continues Lake-town after %s and pays the configured reward once',
    async (roll, result, coins) => {
      let save = act(fixture('lake'), 'choose', { action: 'coin' })
      save = toss(
        toss(save, 'heads', () => roll),
        'heads',
        () => roll
      )
      expect(event(save).result).toBe(result)
      save = act(save, 'advance')
      expect(progress(save).trialOutcome).toMatchObject({
        eventId: 'thorin-4.choice',
        game: 'coin',
        result,
        stats: { rounds: 2 },
        next: 'thorin-4.reward',
        reward: { coins },
      })
      expect(chapterReward(node(save), progress(save)).coins).toBe(coins)
      const db = new IDBFactory()
      const store = createIndexedStorage(db)
      await store.replace(save)
      const claim = command(save, 'advance')
      await Promise.all([
        store.update((current) => applyCommand(current, claim)),
        createIndexedStorage(db).update((current) =>
          applyCommand(current, claim)
        ),
      ])
      const claimed = await store.load()
      expect(claimed.coins).toBe(coins)
      expect(node(claimed).type).toBe('camp')
    }
  )

  it('keeps one optional camp reward and restores older chapter and camp saves', () => {
    const camp = fixture('trollshaws', 'camp')
    expect(act(camp, 'side', { action: 'battle' })).toBe(camp)
    const valid = validateSave(camp)
    const oldCamp = structuredClone(valid)
    progress(oldCamp).side = {
      active: true,
      type: 'dice',
      game: { ready: true, rounds: [], result: null },
    }
    expect(validateSave(oldCamp)).toEqual(oldCamp)
    let save = act(valid, 'side', { action: 'coin' })
    save = toss(
      toss(save, 'heads', () => 0),
      'tails',
      () => 1 - Number.EPSILON
    )
    save = act(save, 'advance')
    expect(save.coins).toBe(12)
    expect(progress(save).inventory).toContain('seal')
    expect(progress(save).side.outcome).toMatchObject({
      game: 'coin',
      result: 'win',
      next: null,
    })
    expect(act(save, 'side', { action: 'blackjack' })).toBe(save)
    expect(validateSave(save)).toEqual(save)
    expect(stories.thorin['thorin-3.dice']).toBeDefined()
  })

  it.each([
    ['battle', 'erebor', false, 28],
    ['blackjack', 'lake', false, 12],
    ['dice', 'lake', false, 12],
    ['coin', 'lake', false, 8],
    ['blackjack', 'trollshaws', true, 18],
    ['dice', 'trollshaws', true, 18],
    ['coin', 'trollshaws', true, 12],
  ])('matches the %s preview to the saved award in %s (camp=%s)', async (game, place, side, coins) => {
    let save = act(fixture(place, side ? 'camp' : 'choice'), side ? 'side' : 'choose', { action: game })
    const play = (action, random) => {
      const current = event(save)
      save = act(save, 'play', { action, turn: game === 'battle' ? current.turn : trialTurn(game, current) }, random)
    }
    if (game === 'battle') {
      event(save).enemyHp = 1
      play('spin', () => 0)
      if (event(save).cinematic) play('dismiss')
    }
    if (game === 'blackjack') {
      // A complete deck with a valid standing player hand of 20 and dealer hand of 18.
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
      const deck = ['♠', '♥', '♣', '♦'].flatMap((suit) => ranks.map((rank) => ({ rank, suit })))
      const take = (rank) => deck.splice(deck.findIndex((card) => card.rank === rank), 1)[0]
      Object.assign(event(save), { player: [take('10'), take('K')], dealer: [take('9'), take('9')], deck })
      play('stand')
    }
    if (game === 'dice') {
      for (let round = 0; round < 3; round++) {
        if (round) play('next')
        let draw = 0
        play('roll', () => draw++ < 5 ? 0.95 : 0)
      }
    }
    if (game === 'coin') {
      play('heads', () => 0)
      play('tails', () => 0.95)
    }
    expect(event(save).result).toBe('win')
    const db = new IDBFactory()
    const store = createIndexedStorage(db)
    await store.replace(save)
    const restored = createIndexedStorage(db)
    save = validateSave(await restored.load())
    const reward = trialOutcome(node(save), event(save), nextReward(stories.thorin, node(save)), progress(save)).reward
    expect(reward.coins).toBe(coins)
    const before = save
    const finish = command(save, 'advance')
    const finished = applyCommand(save, finish)
    expect(applyCommand(finished, finish)).toBe(finished)
    if (!side) expect(chapterReward(node(finished), progress(finished))).toEqual(reward)
    else expect(progress(finished).side.outcome.reward).toEqual(reward)
    const granted = side ? finished : act(finished, 'advance')
    expect(granted.coins - before.coins).toBe(reward.coins)
    expect(progress(granted).xp - progress(before).xp).toBe(reward.xp)
    if (reward.item) expect(progress(granted).inventory.filter((item) => item === reward.item)).toHaveLength(1)
  })

  it('resumes a legacy forest trial and still requires the broodmother', () => {
    const old = fixture('mirkwood', 'dice')
    progress(old).event = {
      ready: false,
      result: 'win',
      rounds: Array.from({ length: 3 }, () => ({ player: Array(5).fill(6), opponent: Array(5).fill(1) })),
    }
    const checkpoint = act(validateSave(old), 'advance')
    expect(node(checkpoint).type).toBe('checkpoint')
    expect(progress(checkpoint).completed).not.toContain('mirkwood')
    const battle = act(validateSave(checkpoint), 'advance')
    expect(node(battle)).toMatchObject({ type: 'battle', enemy: 'spider' })
  })

  it('rejects an imported coin history that continues after 2–0', () => {
    const save = act(fixture('lake'), 'choose', { action: 'coin' })
    event(save).rounds = [
      { guess: 'heads', face: 'heads' },
      { guess: 'heads', face: 'heads' },
      { guess: 'heads', face: 'tails' },
    ]
    event(save).result = 'win'
    expect(() => validateSave(save)).toThrow('save-invalid')
  })
})
