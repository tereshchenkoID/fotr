import { heroes } from '../game/content/heroes.js'
import { achievements, enemies, items } from '../game/content/items.js'
import { stories } from '../game/content/stories.js'
import { initialSave, saveVersion } from '../game/core/session.js'
import { ranks, suits } from '../game/minigames/blackjack.js'
import {
  diceCount, duelRounds, startDice, sumDice
} from '../game/minigames/dice.js'
import { paylines } from '../game/minigames/slots.js'

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
const validDie = (face) => integer(face, 1, 6)
const validHand = (dice) => list(dice, validDie) && dice.length === diceCount

const validDuel = (event) => {
  if (!list(event.rounds, (round) => isObject(round) && validHand(round.player) && validHand(round.opponent)) ||
    typeof event.ready !== 'boolean') return false
  if (event.legacy === true)
    return event.rounds.length === 0 && !event.ready && ['win', 'loss'].includes(event.result)
  if (event.legacy !== undefined) return false
  if (!event.rounds.length) return event.ready && event.result === null

  let difference = 0
  for (const [index, round] of event.rounds.entries()) {
    difference += sumDice(round.player) - sumDice(round.opponent)
    if (index + 1 >= duelRounds && difference !== 0)
      return index === event.rounds.length - 1 && !event.ready &&
        event.result === (difference > 0 ? 'win' : 'loss')
  }
  return event.result === null
}

const validFeedback = (feedback) =>
  feedback === undefined || (
    isObject(feedback) &&
    integer(feedback.revision, 1) &&
    ['attack', 'reroll', 'ability', 'guard', 'convert'].includes(feedback.action) &&
    ['critical', 'phaseChanged'].every((key) => typeof feedback[key] === 'boolean') &&
    ['attack', 'damage', 'blocked', 'healing', 'focus', 'shield'].every((key) => integer(feedback[key]))
  )

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
  if (type === 'dice') return validDuel(event)
  return (
    known(enemies, event.enemyId) &&
    validFeedback(event.feedback) &&
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
    Object.entries(event.statuses).every(([id, value]) =>
      ['weaken', 'burn', 'lock', 'curse', 'shift'].includes(id) &&
      integer(value, 0, id === 'weaken' ? paylines.length * 3 + (hero.jackpot.effect.curse || 0) : 4)
    ) &&
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

const migrateDice = (game) => {
  if (!isObject(game) || ![null, 'win', 'loss'].includes(game.result) ||
    !list(game.held, (index) => integer(index, 0, diceCount - 1)) ||
    !integer(game.rolls, 0, 3) || !integer(game.modifier, 0, 3) ||
    !(validHand(game.dice) || (Array.isArray(game.dice) && !game.dice.length && game.rolls === 3 && !game.held.length && !game.result)))
    throw new Error('save-invalid')
  return game.result
    ? { rounds: [], ready: false, result: game.result, legacy: true }
    : startDice()
}

export const migrateSave = (stored) => {
  if (!isObject(stored)) throw new Error('save-invalid')
  if (stored.version === saveVersion) return stored
  if (![1, 2].includes(stored.version)) throw new Error('save-version')
  const { settings: _settings, preferences: _preferences, ...previous } = stored
  const roster = isObject(previous.heroes) ? Object.fromEntries(
    Object.entries(previous.heroes).map(([id, progress]) => {
      if (!isObject(progress)) return [id, progress]
      const adapted = { side: null, ...progress }
      if (stories[id]?.[adapted.node]?.type === 'dice') adapted.event = migrateDice(adapted.event)
      if (adapted.side?.type === 'dice')
        adapted.side = { ...adapted.side, game: migrateDice(adapted.side.game) }
      return [id, adapted]
    })
  ) : previous.heroes
  return {
    ...(stored.version === 1 ? initialSave() : {}),
    ...previous,
    version: saveVersion,
    heroes: roster,
  }
}

const updateFiveArmiesEncounter = (save) => {
  if (!isObject(save.heroes)) return save
  const roster = Object.entries(save.heroes)
  for (const [id, progress] of roster) {
    if (!known(heroes, id) || !isObject(progress)) continue
    const node = stories[id][progress.node]
    const event = progress.event
    if (node?.enemy !== 'azog' || node.type !== 'battle' ||
      !isObject(event) || event.enemyId !== heroes[id].boss) continue
    const statuses = event.statuses
    if (!isObject(statuses)) continue
    const { burn, ...rest } = statuses
    const updated = {
      ...event,
      enemyId: 'azog',
      statuses: event.enemyId === 'dragon' && integer(burn, 1, 4)
        ? { ...rest, lock: Math.max(rest.lock || 0, burn) }
        : statuses,
    }
    save = { ...save, heroes: { ...save.heroes, [id]: { ...progress, event: updated } } }
  }
  return save
}

export const validateSave = (data) => {
  const save = updateFiveArmiesEncounter(migrateSave(data))
  const valid =
    integer(save.revision) &&
    integer(save.coins) &&
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
