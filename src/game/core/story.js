import { chapterKey, stories } from '../content/stories.js'

export const getNode = (hero, progress) => {
  if (progress.side?.active) {
    return {
      id: 'side',
      type: progress.side.type,
      location: progress.location,
      chapter: progress.chapter,
      side: true,
      speaker: stories[hero.id][progress.node].speaker,
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

export const chapterReward = (node, progress) =>
  progress.result === 'loss' ? { ...node.reward, coins: 4 } : node.reward

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
