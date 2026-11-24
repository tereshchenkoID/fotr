import { IDBFactory } from 'fake-indexeddb'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

import en from '../messages/en.json'
import ru from '../messages/ru.json'
import uk from '../messages/uk.json'
import { heroes } from '../src/game/content/heroes.js'
import { stories } from '../src/game/content/stories.js'
import { heroStats } from '../src/game/core/battle.js'
import {
  applyCommand,
  initialSave,
  sceneFor,
  trialTurn,
} from '../src/game/core/session.js'
import { canTravel, getNode, storyLine } from '../src/game/core/story.js'
import { createIndexedStorage } from '../src/services/indexed-storage.js'
import { validateSave } from '../src/services/save-schema.js'

const hero = heroes.thorin
const progress = (save) => save.heroes.thorin
const node = (save) => getNode(hero, progress(save))
const start = () => applyCommand(initialSave(), { type: 'select', id: hero.id })
const commandFor = (save, type, args) => ({
  hero: hero.id,
  node: node(save).id,
  type,
  ...args,
})
const act = (save, type, args, random) =>
  applyCommand(save, commandFor(save, type, args), random)
const advance = (save) => act(save, 'advance')
const choose = (save, action) => act(save, 'choose', { action })

const finishDialogue = (save) => {
  while (node(save).type === 'dialogue') {
    expect(validateSave(save)).toEqual(save)
    save = advance(save)
  }
  return save
}

const forestCamp = () =>
  advance(finishDialogue(choose(finishDialogue(start()), 'distract')))

const travelToValley = (save) =>
  act(advance(save), 'travel', { location: 'rivendell' })

const roll = (save, action, random) =>
  act(
    save,
    'play',
    {
      action,
      turn: trialTurn('dice', progress(save).side.game),
    },
    random
  )

describe('Thorin’s chronicle', () => {
  it('saves each line, automatically saves the encounter, and resumes independently of other heroes', async () => {
    const factory = new IDBFactory()
    const connection = createIndexedStorage(factory)
    let save = await connection.replace(start())
    save = await connection.update(advance)
    expect(node(save)).toMatchObject({ type: 'dialogue', speaker: 'bilbo' })
    expect(await createIndexedStorage(factory).load()).toEqual(save)
    save = await connection.update(advance)
    expect(node(save).type).toBe('choice')
    expect(progress(save).checkpoint).toBe(node(save).id)

    const thorin = progress(save)
    await connection.update((current) =>
      applyCommand(current, { type: 'select', id: 'frodo' })
    )
    save = await createIndexedStorage(factory).update((current) =>
      applyCommand(current, { type: 'select', id: hero.id })
    )
    expect(progress(save)).toEqual(thorin)
  })

  it('offers a fight and two distinct non-combat paths and keeps the cave loot one-time', () => {
    const encounter = finishDialogue(start())
    const bypass = choose(encounter, 'distract')
    expect(progress(bypass)).toMatchObject({
      flags: { trollDistraction: 1, reputation: 1 },
      event: null,
    })
    expect(choose(encounter, 'sneak')).toEqual(encounter)
    const equipped = act(encounter, 'equip', { id: 'waystone' })
    const sneaking = choose(equipped, 'sneak')
    expect(progress(sneaking).flags.trollSecret).toBe(1)
    expect(sneaking.coins - bypass.coins).toBe(4)
    expect(node(sneaking).line).toBe('trollDawn')
    const chest = finishDialogue(sneaking)
    expect(node(chest).type).toBe('reward')
    const collect = commandFor(chest, 'advance')
    const collected = applyCommand(chest, collect)
    expect(collected.coins).toBe(16)
    expect(progress(collected).completed).toEqual(['trollshaws'])
    expect(applyCommand(collected, collect)).toBe(collected)
    expect(canTravel(hero, progress(collected), 'rivendell')).toBe(false)
    expect(canTravel(hero, progress(advance(collected)), 'rivendell')).toBe(
      true
    )
  })

  it('reopens the encounter after a combat loss and resumes before exploring the cave after a win', async () => {
    const encounter = finishDialogue(start())
    progress(encounter).hp = 1
    let loss = choose(encounter, 'battle')
    loss = act(loss, 'play', { action: 'spin', turn: 0 }, () => 0.51)
    expect(progress(loss).event.result).toBe('loss')
    let save = advance(loss)
    expect(node(save).type).toBe('choice')
    expect(progress(save).hp).toBe(heroStats(hero, progress(save)).hp)
    save = choose(save, 'battle')
    const factory = new IDBFactory()
    const connection = createIndexedStorage(factory)
    save = await connection.replace(save)
    for (let i = 0; i < 8 && !progress(save).event.result; i++) {
      const { turn } = progress(save).event
      save = await connection.update((current) =>
        act(current, 'play', { action: 'spin', turn }, () => 0)
      )
      if (progress(save).event.cinematic) {
        expect(await createIndexedStorage(factory).load()).toEqual(save)
        save = await connection.update((current) =>
          act(current, 'play', { action: 'dismiss', turn: turn + 1 })
        )
      }
    }
    expect(progress(save).event.result).toBe('win')
    expect(node(advance(save)).line).toBe('trollDawn')
  })

  it.each([true, false])(
    'keeps a tied camp duel open and returns to camp after the extra round (win=%s)',
    (win) => {
      let save = act(forestCamp(), 'side', { action: 'dice' })
      expect(node(save)).toMatchObject({
        speaker: 'balin',
        side: true,
        type: 'dice',
      })
      for (let round = 0; round < 3; round++) {
        save = roll(save, 'roll', () => 0.5)
        expect(progress(save).side.game.result).toBeNull()
        save = roll(save, 'next')
      }
      let count = 0
      save = roll(save, 'roll', () => (count++ < 5 === win ? 0.99 : 0))
      expect(progress(save).side.game.rounds).toHaveLength(4)
      expect(progress(save).side.game.result).toBe(win ? 'win' : 'loss')
      expect(validateSave(save)).toEqual(save)
      save = advance(save)
      expect(node(save).type).toBe('camp')
      expect(progress(save).inventory.includes('seal')).toBe(win)
      expect(act(save, 'side')).toEqual(save)
      expect(node(travelToValley(save)).location).toBe('rivendell')
    }
  )

  it('offers two ways to read the moon-letters without a fight and claims and equips the gift once', async () => {
    const save = finishDialogue(travelToValley(forestCamp()))
    expect(node(save).actions.map(({ id }) => id)).toEqual([
      'showMap',
      'askBalin',
    ])
    const direct = choose(save, 'showMap')
    const counsel = choose(save, 'askBalin')
    expect(node(direct).line).toBe('elrondRunes')
    expect(node(counsel).line).toBe('balinCounsel')
    expect(progress(counsel).xp).toBe(progress(direct).xp + 5)
    const gift = finishDialogue(counsel)
    const factory = new IDBFactory()
    const connection = createIndexedStorage(factory)
    await connection.replace(gift)
    const claim = commandFor(gift, 'advance', { equip: 'ember' })
    await Promise.all([
      connection.update((current) => applyCommand(current, claim)),
      createIndexedStorage(factory).update((current) =>
        applyCommand(current, claim)
      ),
    ])
    const rested = await connection.load()
    expect(progress(rested)).toMatchObject({
      equipped: ['ember'],
      completed: ['trollshaws', 'rivendell'],
    })
    expect(
      progress(rested).inventory.filter((id) => id === 'ember')
    ).toHaveLength(1)
    expect(progress(rested).hp).toBe(heroStats(hero, progress(rested)).hp)
    expect(act(rested, 'side')).toEqual(rested)
    expect(canTravel(hero, progress(advance(rested)), 'goblins')).toBe(true)
  })

  it('loads an old Rivendell checkpoint and an existing Blackjack hand and keeps that route playable', () => {
    const valley = travelToValley(forestCamp())
    const checkpoint = structuredClone(valley)
    progress(checkpoint).node = 'thorin-1.checkpoint'
    expect(validateSave(checkpoint)).toEqual(checkpoint)
    expect(node(advance(checkpoint)).id).toBe('thorin-1.choice')

    const oldHand = structuredClone(checkpoint)
    progress(oldHand).node = 'thorin-1.blackjack'
    progress(oldHand).event = { player: [], dealer: [], deck: [], result: null }
    let save = act(
      validateSave(oldHand),
      'play',
      { action: 'deal', turn: 0 },
      () => 0
    )
    if (!progress(save).event.result) {
      save = act(save, 'play', { action: 'stand', turn: 8 })
    }
    expect(validateSave(save)).toEqual(save)
    expect(node(advance(save)).type).toBe('reward')
  })

  it('keeps Lake-town open after a card loss and awards the reduced coins only once', () => {
    let save = finishDialogue(travelToValley(forestCamp()))
    save = advance(finishDialogue(choose(save, 'showMap')))
    for (const location of ['goblins', 'mirkwood', 'lake']) {
      save = act(advance(save), 'travel', { location })
      save = finishDialogue(save)
      if (location === 'goblins') {
        save = act(save, 'equip', { id: 'ember' })
        save = advance(choose(save, 'useArtifact'))
      }
      if (location === 'mirkwood') {
        while (!progress(save).event.result) {
          const { turn } = progress(save).event
          save = act(save, 'play', { action: 'spin', turn }, () => 0)
          if (progress(save).event.cinematic)
            save = act(save, 'play', { action: 'dismiss', turn: turn + 1 })
        }
        save = advance(advance(save))
      }
    }
    save = choose(save, 'blackjack')
    expect(node(save).dealer).toBe('lakeTrader')
    save = act(save, 'play', { action: 'deal', turn: 0 }, () => 0)
    save = act(save, 'play', { action: 'stand', turn: 8 })
    expect(progress(save).event.result).toBe('loss')
    save = advance(save)
    const claim = commandFor(save, 'advance')
    const claimed = applyCommand(save, claim)
    expect(claimed.coins - save.coins).toBe(4)
    expect(applyCommand(claimed, claim)).toBe(claimed)
    expect(canTravel(hero, progress(advance(claimed)), 'erebor')).toBe(true)
    save = claimed
    for (const [place, enemy, line] of [
      ['erebor', 'dragon', 'mountainKeyReady'],
      ['five', 'azog', 'afterSmaug'],
    ]) {
      save = act(advance(save), 'travel', { location: place })
      expect(storyLine(node(save), progress(save))).toBe(line)
      save = finishDialogue(save)
      expect(node(save)).toMatchObject({ type: 'battle', enemy, boss: true })
      for (let i = 0; i < 16 && !progress(save).event.result; i++) {
        const { turn } = progress(save).event
        save = act(save, 'play', { action: 'spin', turn }, () => 0)
        if (progress(save).event.cinematic)
          save = act(save, 'play', { action: 'dismiss', turn: turn + 1 })
      }
      expect(progress(save).event.result).toBe('win')
      save = advance(save)
      expect(progress(save).flags[`defeated-${enemy}`]).toBe(1)
      save = advance(save)
      expect(validateSave(save)).toEqual(save)
    }
    expect(storyLine(node(save), progress(save))).toBe('thorinPeace')
    expect(progress(save).completed).toEqual(hero.route)
  })

  it.each([
    ['Story', ['.content', '.speech .quoteText', '.artifact']],
    ['World', ['.pin[data-state=here]::before']],
    ['Trials/Blackjack', ['.flight', '.cardInner']],
  ])('disables motion in the compiled %s stylesheet', (module, selectors) => {
    const source = new URL(
      `../src/modules/${module}/index.module.scss`,
      import.meta.url
    )
    const loadPaths = [fileURLToPath(new URL('../src/scss/', import.meta.url))]
    const { css } = compileString(
      `@use "config" as *;\n${readFileSync(source, 'utf8')}`,
      { loadPaths }
    )
    const reducedMotion = css.split(
      '@media (prefers-reduced-motion: reduce) {'
    )[1]
    for (const selector of selectors)
      expect(reducedMotion.replaceAll('"', '')).toContain(selector)
    expect(reducedMotion).toMatch(/(?:animation|transition): none/)
  })

  it('localizes every authored scene and action in all three languages', () => {
    for (const locale of [en, ru, uk]) {
      for (const scene of Object.values(stories.thorin)) {
        for (const line of [scene.line, ...(scene.lineVariants || []).map((variant) => variant.line)].filter(Boolean))
          expect(locale.chronicle.lines[line]).toMatchObject({
            title: expect.any(String),
            text: expect.any(String),
          })
        if (scene.title && !scene.line && sceneFor(scene) === 'story')
          expect(locale.chronicle.titles[scene.title][scene.type]).toBeTruthy()
        if (scene.dealer) expect(locale.trials.dealers[scene.dealer]).toBeTruthy()
        for (const action of scene.actions || []) {
          if (action.title)
            expect(locale.chronicle.actions[action.title]).toMatchObject({
              name: expect.any(String),
              effect: expect.any(String),
            })
        }
      }
    }
  })
})
