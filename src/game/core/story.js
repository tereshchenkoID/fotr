import { chapterKey, stories } from '../content/stories.js'

import { encounterPrize } from './trials.js'

export const getNode = (hero, progress) => {
  if (progress.side?.active) {
    return {
      id: 'side',
      type: progress.side.type,
      location: progress.location,
      chapter: progress.chapter,
      side: true,
      speaker: stories[hero.id][progress.node].speaker,
      encounter: progress.node,
    }
  }
  return stories[hero.id][progress.node]
}

export const startNode = (hero) => `${chapterKey(hero, 0)}.dialogue`

export const canChoose = (action, progress) =>
  Object.entries(action.requires || {}).every(([key, value]) =>
    key === 'artifact'
      ? progress.equipped.includes(value)
      : (progress.flags[key] || 0) >= value
  )

export const automaticGame = (node, progress) => {
  if (progress.result === 'loss' || !node.actions?.length) return null
  const available = node.actions.filter((action) => canChoose(action, progress))
  // A disabled narrative alternative may become available through equipment.
  if (node.actions.some((action) => !action.game)) return null
  return available.length === 1 ? available[0] : null
}

export const chapterReward = (node, progress) =>
  encounterPrize(node, progress.trialOutcome?.rewardNode === node.id
    ? progress.trialOutcome.game : undefined, progress.result)

export const canTravel = (hero, progress, location) =>
  !!location && hero.route[progress.chapter + 1] === location &&
  getNode(hero, progress).type === 'travel'

export const markChoice = (hero, progress, choice) => {
  const flags = { ...progress.flags }
  if (choice.flag) flags[choice.flag] = (flags[choice.flag] || 0) + 1
  if (hero.id === 'sauron') {
    flags.influence =
      (flags.influence || 0) + (choice.id === 'blackjack' ? 2 : 1)
    if (choice.id === 'corrupt') flags.corruption = (flags.corruption || 0) + 2
  } else if (choice.id !== 'battle')
    flags.reputation = (flags.reputation || 0) + 1
  return flags
}
