import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'

import en from '../messages/en.json'
import ru from '../messages/ru.json'
import uk from '../messages/uk.json'
import { heroes } from '../src/game/content/heroes.js'
import { enemies } from '../src/game/content/items.js'
import { stories } from '../src/game/content/stories.js'
import { campaigns, locations } from '../src/game/content/world.js'
import {
  applyCommand,
  initialSave,
  sceneFor,
  trialTurn,
} from '../src/game/core/session.js'
import { canTravel, getNode } from '../src/game/core/story.js'
import { createIndexedStorage } from '../src/services/indexed-storage.js'
import { validateSave } from '../src/services/save-schema.js'

const active = (save) => save.heroes[save.activeHero]
const hero = (save) => heroes[save.activeHero]
const node = (save) => getNode(hero(save), active(save))
const command = (save, type, props) => ({
  hero: save.activeHero,
  node: node(save).id,
  type,
  ...props,
})
const step = (save, type, props, random = () => 0.99) =>
  applyCommand(save, command(save, type, props), random)
const start = (id) => applyCommand(initialSave(), { type: 'select', id })
const encounter = (save) => step(step(save, 'advance'), 'advance')
const choose = (save, action) => step(save, 'choose', { action })
const diceCommand = (save, action, random) => step(save, 'play', {
  action,
  turn: trialTurn('dice', active(save).event),
}, random)
const roll = (save) => {
  let calls = 0
  return diceCommand(save, 'roll', () => calls++ < 5 ? 0.99 : 0)
}
const winDuel = (save) => {
  while (!active(save).event.result)
    save = active(save).event.ready ? roll(save) : diceCommand(save, 'next')
  return save
}
const keys = (value, path = '') =>
  Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === 'string' ? [path + key] : keys(entry, path + key + '.')
  )

describe('Story graph', () => {
  it('places Azog at the Battle of the Five Armies and Smaug at Erebor', () => {
    for (const hero of Object.values(heroes).filter(({ route }) => route.includes('five'))) {
      const chapter = hero.route.indexOf('five')
      expect(stories[hero.id][`${hero.storyId}-${chapter}.battle`]).toMatchObject({
        boss: true, enemy: 'azog',
      })
    }
    const thorin = heroes.thorin
    expect(stories.thorin[`${thorin.storyId}-${thorin.route.indexOf('erebor')}.battle`])
      .toMatchObject({ boss: true, enemy: 'dragon' })
  })

  it('has connected paths and localized content for all 18 heroes and three campaigns', () => {
    expect(Object.keys(campaigns)).toHaveLength(3)
    expect(Object.keys(heroes)).toHaveLength(18)
    expect(keys(ru)).toEqual(keys(en))
    expect(keys(uk)).toEqual(keys(en))
    for (const config of Object.values(heroes)) {
      const graph = stories[config.id]
      expect(config.route.length).toBeGreaterThan(3)
      expect(
        config.route.every((id) =>
          campaigns[config.campaignId].locationIds.includes(id)
        )
      ).toBe(true)
      for (const scene of Object.values(graph)) {
        expect(locations[scene.location]).toBeDefined()
        if (scene.next) expect(graph[scene.next]).toBeDefined()
        if (scene.enemy) expect(enemies[scene.enemy]).toBeDefined()
        for (const action of scene.actions || [])
          expect(graph[action.next]).toBeDefined()
      }
      for (const locale of [en, ru, uk]) {
        expect(locale.heroes[config.id]).toHaveProperty('ending')
        expect(
          config.slotConfig.pool.every(({ id }) => locale.symbols[id])
        ).toBe(true)
        expect(config.route.every((id) => locale.landmarks[id])).toBe(true)
      }
    }
  })

  it('takes each hero through a complete campaign with warps denied until travel opens', () => {
    for (const config of Object.values(heroes)) {
      let save = start(config.id)
      for (let chapter = 0; chapter < config.route.length; chapter++) {
        expect(active(save).location).toBe(config.route[chapter])
        expect(canTravel(config, active(save), config.route[chapter + 1])).toBe(
          false
        )
        save = encounter(save)
        const final = chapter === config.route.length - 1
        const choices = node(save).actions
        if (choices) {
          const action = choices.find(({ id }) => id === 'dice') || choices[0]
          save = choose(save, action.id)
        }
        expect(validateSave(save)).toEqual(save)
        if (node(save).type === 'battle') {
          for (let turns = 0; turns < 14 && !active(save).event.result; turns++) {
            const { turn } = active(save).event
            save = step(save, 'play', { action: 'spin', turn }, () => 0)
            if (active(save).event.cinematic)
              save = step(save, 'play', { action: 'dismiss', turn: turn + 1 })
          }
          expect(active(save).event.result).toBe('win')
          save = step(save, 'advance')
        } else if (node(save).type === 'dice') {
          save = winDuel(save)
          expect(active(save).event.result).toBe('win')
          save = step(save, 'advance')
        } else if (node(save).type === 'blackjack') {
          save = step(save, 'play', { action: 'deal' })
          save = step(save, 'play', { action: 'stand' })
          expect(active(save).event.result).toBeTruthy()
          save = step(save, 'advance')
        }
        while (node(save).type === 'dialogue') {
          expect(validateSave(save)).toEqual(save)
          save = step(save, 'advance')
        }
        expect(node(save).type).toBe('reward')
        save = step(save, 'advance')
        if (final) {
          expect(node(save).type).toBe('end')
          expect(active(save).inventory).toContain('crown')
        } else {
          expect(node(save).type).toBe('camp')
          save = step(save, 'advance')
          expect(sceneFor(node(save))).toBe('world')
          expect(
            canTravel(config, active(save), config.route[chapter + 1])
          ).toBe(true)
          save = step(save, 'travel', { location: config.route[chapter + 1] })
        }
      }
      expect(active(save).completed).toEqual(config.route)
      expect(save.achievements).toContain('finished')
    }
  })

  it('unlocks negotiations through reputation and crafts Sauron’s artifact through influence', () => {
    let save = encounter(start('frodo'))
    expect(active(choose(save, 'negotiate')).node).toBe(active(save).node)
    save = step(
      winDuel(choose(save, 'dice')),
      'advance'
    )
    save = step(step(save, 'advance'), 'advance')
    save = encounter(step(save, 'travel', { location: 'bree' }))
    save = step(
      winDuel(choose(save, 'dice')),
      'advance'
    )
    save = step(step(save, 'advance'), 'advance')
    save = encounter(step(save, 'travel', { location: 'weathertop' }))
    expect(active(choose(save, 'negotiate')).flags.accord).toBe(1)

    save = choose(encounter(start('sauron')), 'blackjack')
    expect(active(save).event.player).toEqual([])
    expect(validateSave(save)).toEqual(save)
    save = step(save, 'play', { action: 'deal' })
    save = step(step(save, 'play', { action: 'stand' }), 'advance')
    save = step(step(save, 'advance'), 'advance')
    save = encounter(step(save, 'travel', { location: 'eregion' }))
    expect(active(choose(save, 'corrupt'))).toMatchObject({
      flags: { corruption: 2, forged: 1 },
      inventory: ['waystone', 'dominion'],
    })
  })

  it('restarts a lost battle at its checkpoint while keeping rewards and earned reputation', () => {
    let save = choose(encounter(start('frodo')), 'battle')
    active(save).event.hp = 1
    const before = active(save).checkpoint
    save = step(save, 'play', { action: 'spin', turn: 0 }, () => 0.51)
    expect(active(save).event.result).toBe('loss')
    save = step(save, 'advance')
    expect(active(save)).toMatchObject({
      node: before,
      hp: heroes.frodo.stats.hp,
      event: null,
      xp: 0,
    })
  })
})

describe('Persisted sessions', () => {
  it.each([2, 3])('loads a v%i Thorin save from the old final fight and preserves its victory', async (version) => {
    const save = start('thorin')
    const progress = active(save)
    const chapter = hero(save).route.indexOf('five')
    const checkpoint = `${hero(save).storyId}-${chapter}.choice`
    Object.assign(progress, { location: 'five', chapter, node: checkpoint, checkpoint })
    const legacy = choose(save, 'battle')
    legacy.version = version
    Object.assign(active(legacy).event, {
      enemyId: 'dragon', enemyHp: 0, focus: 9, turn: 10,
      phase: 2, statuses: { burn: 1, shift: 2 }, result: 'win',
    })
    const storage = createIndexedStorage(new IDBFactory())
    const restored = await storage.replace(legacy)
    expect(active(restored).event).toMatchObject({
      enemyId: 'azog', enemyHp: 0, focus: 9, turn: 10,
      phase: 2, statuses: { lock: 1, shift: 2 }, result: 'win',
    })
    expect(active(restored).event.statuses).not.toHaveProperty('burn')
    const next = await storage.update((current) => step(current, 'advance'))
    expect(node(next).type).toBe('reward')
    expect(active(next).result).toBe('win')
  })

  it('restores exact hero progress, active bonus games and in-flight battle results', async () => {
    const factory = new IDBFactory()
    const first = createIndexedStorage(factory)
    let save = await first.update(() =>
      choose(encounter(start('frodo')), 'dice')
    )
    expect(
      active(await createIndexedStorage(factory).load()).event
    ).toMatchObject({ rounds: [], ready: true })
    save = await first.update((current) =>
      roll(current)
    )
    const snapshot = active(save)
    save = await first.update((current) =>
      applyCommand(current, { type: 'select', id: 'sauron' })
    )
    save = await first.update((current) => choose(encounter(current), 'battle'))
    save = await first.update((current) =>
      step(current, 'play', { action: 'spin', turn: 0 }, () => 0)
    )
    expect(active(save).event.cinematic).toBe(true)
    const reload = createIndexedStorage(factory)
    expect(await reload.load()).toEqual(save)
    save = await reload.update((current) =>
      applyCommand(current, { type: 'select', id: 'frodo' })
    )
    expect(active(save)).toEqual(snapshot)
    save = await reload.update((current) => {
      const scored = step(winDuel(current), 'advance')
      return step(step(scored, 'advance'), 'side')
    })
    expect(active(save).side.active).toBe(true)
    expect(await createIndexedStorage(factory).load()).toEqual(save)
  })

  it('rejects repeated roll and hit commands with a stale turn after persistence', async () => {
    const storage = createIndexedStorage(new IDBFactory())
    const dice = await storage.update(() => choose(encounter(start('frodo')), 'dice'))
    const rollCommand = command(dice, 'play', { action: 'roll', turn: 0 })
    await storage.update(current => applyCommand(current, rollCommand, () => 0.5))
    await storage.update(current => applyCommand(current, rollCommand, () => 0.25))
    const restored = await storage.load()
    expect(active(restored).event.rounds).toHaveLength(1)
    const next = command(restored, 'play', { action: 'next', turn: 1 })
    const ready = await storage.update(current => applyCommand(current, next))
    expect(active(ready).event.ready).toBe(true)
    expect(await storage.update(current => applyCommand(current, next))).toEqual(ready)

    const cards = await storage.replace(step(choose(encounter(start('sauron')), 'blackjack'), 'play', { action: 'deal' }, () => 0))
    if (active(cards).event.result) throw new Error('Expected an active hand')
    const hitCommand = command(cards, 'play', { action: 'hit', turn: 8 })
    await storage.update(current => applyCommand(current, hitCommand))
    await storage.update(current => applyCommand(current, hitCommand))
    expect(active(await storage.load()).event.player).toHaveLength(3)
  })

  it('serializes duplicate reward claims from different database connections', async () => {
    const factory = new IDBFactory()
    const first = createIndexedStorage(factory)
    const second = createIndexedStorage(factory)
    let save = await first.update(() => {
      const trial = winDuel(choose(encounter(start('frodo')), 'dice'))
      return step(trial, 'advance')
    })
    const claim = command(save, 'advance')
    await Promise.all([
      first.update((current) => applyCommand(current, claim)),
      second.update((current) => applyCommand(current, claim)),
    ])
    save = await first.load()
    expect(save.coins).toBe(12)
    expect(active(save)).toMatchObject({ xp: 30, completed: ['shire'] })
  })

  it('migrates v1 preferences and rejects corrupted imports without losing the stored save', async () => {
    const storage = createIndexedStorage(new IDBFactory())
    const v1 = {
      ...start('bilbo'),
      version: 1,
      preferences: { autoSpin: false },
    }
    delete v1.heroes.bilbo.side
    const migrated = await storage.replace(v1)
    expect(migrated).toMatchObject({
      version: 3,
      heroes: { bilbo: { side: null } },
    })
    expect(migrated).not.toHaveProperty('settings')
    const bad = { ...migrated, heroes: { bilbo: { node: 'invalid' } } }
    await expect(storage.replace(bad)).rejects.toThrow('save-invalid')
    await expect(storage.replace({ ...migrated, version: 4 })).rejects.toThrow(
      'save-version'
    )
    expect(await storage.load()).toEqual(migrated)
  })
  it('migrates v2 Dice and preserves completed outcomes, side quests and claims', () => {
    const v2 = choose(encounter(start('frodo')), 'dice')
    v2.version = 2
    v2.settings = { autoSpin: true }
    active(v2).event = { dice: [1, 2, 3, 4, 5], held: [1], rolls: 1, modifier: 1, result: null }
    active(v2).side = { active: false, type: 'dice', game: {
      dice: [6, 6, 6, 6, 6], held: [], rolls: 2, modifier: 0, result: 'win', score: 60, combination: 'five',
    } }
    active(v2).claimed = ['side']
    const migrated = validateSave(v2)
    expect(active(migrated)).toMatchObject({
      node: active(v2).node,
      event: { rounds: [], ready: true, result: null },
      side: { active: false, game: { rounds: [], ready: false, result: 'win', legacy: true } },
      claimed: ['side'],
    })
    expect(migrated).not.toHaveProperty('settings')
  })

  it('restores multi-line enemy weakening from IndexedDB', async () => {
    const factory = new IDBFactory()
    const first = createIndexedStorage(factory)
    const battle = choose(encounter(start('gandalf')), 'battle')
    const save = await first.update(() => step(battle, 'play', { action: 'spin', turn: 0 }, () => 0.99))
    expect(active(save).event.statuses.weaken).toBe(15)
    expect(await createIndexedStorage(factory).load()).toEqual(save)
  })

})
