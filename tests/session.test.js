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
const roll = (save) => step(save, 'play', { action: 'roll' })
const keys = (value, path = '') =>
  Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === 'string' ? [path + key] : keys(entry, path + key + '.')
  )

describe('Story graph', () => {
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
        if (node(save).boss) {
          save = choose(save, 'battle')
          for (let turn = 0; turn < 9 && !active(save).event.result; turn++) {
            save = step(save, 'play', { action: 'spin', turn }, () => 0)
            if (active(save).event.cinematic)
              save = step(save, 'play', { action: 'dismiss', turn: turn + 1 })
          }
          expect(active(save).event.result).toBe('win')
        } else {
          save = choose(save, 'dice')
          expect(active(save).event).toMatchObject({ dice: [], rolls: 3 })
          expect(validateSave(save)).toEqual(save)
          save = step(roll(save), 'play', { action: 'score' })
          expect(active(save).event.result).toBe('win')
        }
        expect(validateSave(save)).toEqual(save)
        save = step(save, 'advance')
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
      step(roll(choose(save, 'dice')), 'play', { action: 'score' }),
      'advance'
    )
    save = step(step(save, 'advance'), 'advance')
    save = encounter(step(save, 'travel', { location: 'bree' }))
    save = step(
      step(roll(choose(save, 'dice')), 'play', { action: 'score' }),
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
  it('restores exact hero progress, active bonus games and in-flight battle results', async () => {
    const factory = new IDBFactory()
    const first = createIndexedStorage(factory)
    let save = await first.update(() =>
      choose(encounter(start('frodo')), 'dice')
    )
    expect(
      active(await createIndexedStorage(factory).load()).event
    ).toMatchObject({ dice: [], rolls: 3 })
    save = await first.update((current) =>
      step(roll(current), 'play', { action: 'hold', index: 0 })
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
      const scored = step(step(current, 'play', { action: 'score' }), 'advance')
      return step(step(scored, 'advance'), 'side')
    })
    expect(active(save).side.active).toBe(true)
    expect(await createIndexedStorage(factory).load()).toEqual(save)
  })

  it('serializes duplicate reward claims from different database connections', async () => {
    const factory = new IDBFactory()
    const first = createIndexedStorage(factory)
    const second = createIndexedStorage(factory)
    let save = await first.update(() => {
      const trial = roll(choose(encounter(start('frodo')), 'dice'))
      return step(step(trial, 'play', { action: 'score' }), 'advance')
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
      version: 2,
      settings: { autoSpin: false },
      heroes: { bilbo: { side: null } },
    })
    const bad = { ...migrated, heroes: { bilbo: { node: 'invalid' } } }
    await expect(storage.replace(bad)).rejects.toThrow('save-invalid')
    await expect(storage.replace({ ...migrated, version: 3 })).rejects.toThrow(
      'save-version'
    )
    expect(await storage.load()).toEqual(migrated)
  })
})
