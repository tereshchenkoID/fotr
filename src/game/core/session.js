import { heroes } from '../content/heroes.js'
import { campaigns } from '../content/world.js'
import { playBlackjack, startBlackjack } from '../minigames/blackjack.js'
import { playDice, startDice } from '../minigames/dice.js'

import { heroStats, playBattle, startBattle } from './battle.js'
import { grant } from './rewards.js'
import {
  canChoose,
  canTravel,
  chapterReward,
  getNode,
  markChoice,
  startNode,
} from './story.js'

export const saveVersion = 3
export const initialSave = () => ({
  version: saveVersion,
  revision: 0,
  activeHero: null,
  heroes: {},
  coins: 0,
  achievements: [],
  collection: [],
})

export const newProgress = (hero) => ({
  location: hero.startingLocationId,
  chapter: 0,
  node: startNode(hero),
  checkpoint: null,
  hp: hero.stats.hp,
  xp: 0,
  level: 1,
  claimed: [],
  inventory: [...hero.artifacts],
  equipped: [],
  flags: {},
  visited: [hero.startingLocationId],
  completed: [],
  event: null,
  side: null,
  result: null,
})

const launch = (hero, progress, node, random) => {
  if (node.type === 'battle')
    return startBattle(hero, progress, node.enemy, random)
  if (node.type === 'blackjack') return startBlackjack()
  if (node.type === 'dice') return startDice()
  return null
}

export const trialTurn = (type, event) => type === 'blackjack'
  ? (event.player.length + event.dealer.length) * 2 + Number(!!event.result)
  : event.rounds.length * 2 - Number(!event.ready)

const playEvent = (save, hero, progress, node, command, random) => {
  const event = node.side ? progress.side.game : progress.event
  if (!event) return
  if (node.type === 'battle' && command.turn !== event.turn) return
  if (node.type === 'dice' && command.turn !== trialTurn('dice', event)) return
  if (node.type === 'blackjack' && command.turn !== undefined && command.turn !== trialTurn('blackjack', event)) return
  const { action, index } = command
  let next = event
  if (node.type === 'battle')
    next = playBattle(event, hero, progress, action, index, random)
  if (node.type === 'blackjack') next = playBlackjack(event, action, random)
  if (node.type === 'dice') next = playDice(event, action, random)
  if (next === event) return
  if (node.side) progress.side.game = next
  else progress.event = next
  if (node.type === 'battle') {
    progress.hp = next.hp
    if (next.cinematic)
      grant(save, hero, progress, 'jackpot', { achievement: 'jackpot' })
  }
  return true
}

const finishEvent = (save, hero, progress, node) => {
  const event = node.side ? progress.side.game : progress.event
  if (!event?.result || event.cinematic) return
  if (node.side) {
    progress.side.active = false
    if (event.result === 'win') {
      grant(save, hero, progress, 'side', {
        coins: 18,
        xp: 25,
        item: 'seal',
        achievement: 'side',
        flag: 'sideComplete',
      })
    }
    return
  }
  progress.event = null
  progress.result = event.result
  if (node.type === 'battle' && event.result === 'loss') {
    progress.node = progress.checkpoint
    progress.hp = heroStats(hero, progress).hp
    return
  }
  if (event.result === 'win') {
    const achievement = node.type === 'blackjack' ? 'cards' : node.type
    grant(save, hero, progress, achievement, { achievement })
  }
  progress.node = node.next
}

const advance = (save, hero, progress, node, command) => {
  if (node.side || ['battle', 'blackjack', 'dice'].includes(node.type)) {
    finishEvent(save, hero, progress, node)
    return
  }
  if (!node.next || ['travel', 'choice'].includes(node.type)) return
  const next = getNode(hero, { ...progress, node: node.next })
  if (node.type === 'checkpoint' || next.type === 'checkpoint') {
    progress.checkpoint = next.type === 'checkpoint' ? next.next : next.id
    progress.node = progress.checkpoint
    return
  }
  if (node.type === 'camp') progress.hp = heroStats(hero, progress).hp
  if (node.type === 'reward') {
    grant(save, hero, progress, node.id, chapterReward(node, progress))
    const item = node.reward.item
    if (command.equip === item && progress.inventory.includes(item) && !progress.equipped.includes(item) &&
      progress.equipped.length < 2) progress.equipped.push(item)
    if (!progress.completed.includes(node.location)) progress.completed.push(node.location)
    if (next.autoRest) progress.hp = heroStats(hero, progress).hp
  }
  progress.node = node.next
}

const choose = (save, hero, progress, node, command, random) => {
  const choice = node.actions?.find(({ id }) => id === command.action)
  if (!choice || !canChoose(choice, progress)) return
  progress.result = null
  const mark = `decision-${progress.chapter}`
  if (!progress.flags[mark] || choice.flag)
    progress.flags = markChoice(hero, progress, choice)
  progress.flags[mark] = 1
  if (choice.reward) grant(save, hero, progress, `${node.id}:${choice.id}`, choice.reward)
  if (choice.id === 'corrupt')
    grant(save, hero, progress, 'dominion', { item: 'dominion' })
  progress.node = choice.next
  const next = getNode(hero, progress)
  if (next.type === 'battle') progress.checkpoint = node.id
  progress.event = launch(hero, progress, next, random)
}

export const applyCommand = (current, command, random = Math.random) => {
  const save = structuredClone(current)
  if (command.type === 'select') {
    const hero = heroes[command.id]
    if (!hero || !campaigns[hero.campaignId]) return current
    save.heroes[hero.id] ||= newProgress(hero)
    for (const item of save.heroes[hero.id].inventory) {
      if (!save.collection.includes(item)) save.collection.push(item)
    }
    save.activeHero = hero.id
    return save
  }
  const hero = heroes[save.activeHero]
  if (!hero || command.hero !== hero.id) return current
  const progress = save.heroes[hero.id]
  const node = getNode(hero, progress)
  if (command.node !== node.id) return current
  switch (command.type) {
    case 'advance':
      advance(save, hero, progress, node, command)
      break
    case 'choose':
      choose(save, hero, progress, node, command, random)
      break
    case 'play':
      if (!playEvent(save, hero, progress, node, command, random)) return current
      break
    case 'travel':
      if (!canTravel(hero, progress, command.location)) return current
      progress.chapter++
      progress.location = command.location
      progress.visited.push(command.location)
      progress.node = node.next
      progress.result = null
      break
    case 'side': {
      const type = node.campTrial
      if (node.type !== 'camp' || progress.side || !type) return current
      progress.side = { active: true, type }
      progress.side.game = launch(
        hero,
        progress,
        getNode(hero, progress),
        random
      )
      break
    }
    case 'rest':
      if (node.type !== 'camp') return current
      progress.hp = heroStats(hero, progress).hp
      break
    case 'equip':
      if (
        !progress.inventory.includes(command.id) ||
        progress.event ||
        progress.side?.active
      )
        return current
      if (progress.equipped.includes(command.id)) {
        progress.equipped = progress.equipped.filter((id) => id !== command.id)
      } else if (progress.equipped.length < 2) {
        progress.equipped.push(command.id)
      }
      progress.hp = Math.min(progress.hp, heroStats(hero, progress).hp)
      break
    default:
      return current
  }
  return save
}

export const sceneFor = (node) =>
  ({
    battle: 'battle',
    blackjack: 'blackjack',
    dice: 'dice',
    travel: 'world',
  })[node.type] || 'story'
