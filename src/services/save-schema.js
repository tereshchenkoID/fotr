import { heroes } from '../game/content/heroes.js'
import { achievements, enemies, items } from '../game/content/items.js'
import { stories } from '../game/content/stories.js'
import { initialSave, saveVersion } from '../game/core/session.js'
import { ranks, suits } from '../game/minigames/blackjack.js'
import { diceCount, diceRollLimit } from '../game/minigames/dice.js'

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(value) && value >= min && value <= max
const list = (value, valid) => Array.isArray(value) && value.every(valid)
const known = (object, id) =>
  typeof id === 'string' && Object.hasOwn(object, id)
const validResult = (result) => [null, 'win', 'loss', 'draw'].includes(result)
const validCard = (card) =>
  isObject(card) && ranks.includes(card.rank) && suits.includes(card.suit)

const validEvent = (event, type, hero) => {
  if (!['blackjack', 'dice', 'battle'].includes(type)) return event === null
  if (!isObject(event) || !validResult(event.result)) return false
  if (type === 'blackjack') {
    if (
      ![event.player, event.dealer, event.deck].every((hand) =>
        list(hand, validCard)
      )
    )
      return false
    const cards = [...event.player, ...event.dealer, ...event.deck]
    if (!cards.length) return event.result === null
    return (
      event.player.length >= 2 &&
      event.dealer.length >= 2 &&
      cards.length === 52 &&
      new Set(cards.map(({ rank, suit }) => rank + suit)).size === 52
    )
  }
  if (type === 'dice') {
    if (
      !list(event.dice, (die) => integer(die, 1, 6)) ||
      !list(event.held, (index) => integer(index, 0, diceCount - 1)) ||
      !integer(event.rolls, 0, diceRollLimit) ||
      !integer(event.modifier, 0, 3)
    )
      return false
    if (!event.dice.length) {
      return (
        event.rolls === diceRollLimit &&
        !event.held.length &&
        event.result === null
      )
    }
    return (
      event.dice.length === diceCount &&
      (!event.result ||
        (integer(event.score) &&
          [
            'five',
            'four',
            'house',
            'straight',
            'three',
            'twoPair',
            'pair',
            'high',
          ].includes(event.combination)))
    )
  }
  return (
    known(enemies, event.enemyId) &&
    list(
      event.grid,
      (reel) =>
        list(reel, (id) =>
          hero.slotConfig.pool.some((symbol) => symbol.id === id)
        ) && reel.length === 3
    ) &&
    event.grid.length === 5 &&
    typeof event.cinematic === 'boolean' &&
    isObject(event.statuses) &&
    Object.values(event.statuses).every((value) => integer(value, 0, 4)) &&
    [
      'hp',
      'enemyHp',
      'maxHp',
      'focus',
      'turn',
      'phase',
      'cooldown',
      'shield',
    ].every((key) => integer(event[key])) &&
    list(event.held, (index) => integer(index, 0, 4)) &&
    list(
      event.matches,
      (match) =>
        isObject(match) &&
        integer(match.line, 0, 4) &&
        list(
          match.cells,
          (cell) => typeof cell === 'string' && /^[0-4]:[0-2]$/.test(cell)
        )
    ) &&
    (event.log === null ||
      (isObject(event.log) &&
        integer(event.log.attack) &&
        integer(event.log.damage)))
  )
}

const validProgress = (progress, hero) => {
  const graph = stories[hero.id]
  if (
    !isObject(progress) ||
    !known(graph, progress.node) ||
    !integer(progress.chapter, 0, hero.route.length - 1)
  )
    return false
  const node = graph[progress.node]
  return (
    node.chapter === progress.chapter &&
    progress.location === node.location &&
    (progress.checkpoint === null ||
      (known(graph, progress.checkpoint) &&
        graph[progress.checkpoint].type === 'choice')) &&
    integer(progress.hp) &&
    integer(progress.xp) &&
    integer(progress.level, 1) &&
    validResult(progress.result) &&
    isObject(progress.flags) &&
    Object.values(progress.flags).every((flag) => integer(flag)) &&
    list(progress.claimed, (id) => typeof id === 'string') &&
    list(progress.visited, (id) => hero.route.includes(id)) &&
    list(progress.completed, (id) => hero.route.includes(id)) &&
    list(progress.inventory, (id) => known(items, id)) &&
    list(progress.equipped, (id) => progress.inventory.includes(id)) &&
    progress.equipped.length <= 2 &&
    validEvent(progress.event, node.type, hero) &&
    (node.type !== 'battle' ||
      (progress.event.enemyId === node.enemy &&
        progress.event.hp === progress.hp &&
        graph[progress.checkpoint]?.chapter === progress.chapter)) &&
    (progress.side === null ||
      (isObject(progress.side) &&
        typeof progress.side.active === 'boolean' &&
        ['dice', 'blackjack'].includes(progress.side.type) &&
        validEvent(progress.side.game, progress.side.type, hero)))
  )
}

export const migrateSave = (stored) => {
  if (!isObject(stored)) throw new Error('save-invalid')
  if (stored.version === 1) {
    const { preferences, ...previous } = stored
    return {
      ...initialSave(),
      ...previous,
      version: saveVersion,
      heroes: isObject(previous.heroes)
        ? Object.fromEntries(
          Object.entries(previous.heroes).map(([id, progress]) => [
            id,
            { side: null, ...progress },
          ])
        )
        : previous.heroes,
      settings: { autoSpin: preferences?.autoSpin ?? true },
    }
  }
  if (stored.version !== saveVersion) throw new Error('save-version')
  return stored
}

export const validateSave = (data) => {
  const save = migrateSave(data)
  const valid =
    integer(save.revision) &&
    integer(save.coins) &&
    isObject(save.settings) &&
    typeof save.settings.autoSpin === 'boolean' &&
    isObject(save.heroes) &&
    Object.entries(save.heroes).every(
      ([id, progress]) =>
        known(heroes, id) && validProgress(progress, heroes[id])
    ) &&
    (save.activeHero === null || known(save.heroes, save.activeHero)) &&
    list(save.achievements, (id) => achievements.includes(id)) &&
    list(save.collection, (id) => known(items, id))
  if (!valid) throw new Error('save-invalid')
  return save
}
