import { heroStats } from './battle.js'

export const unclaimedReward = (progress, id, reward) => {
  if (!reward || progress.claimed.includes(id)) return null
  return {
    ...reward,
    item: reward.item && !progress.inventory.includes(reward.item) ? reward.item : null,
  }
}

export const grant = (save, hero, progress, eventId, prize) => {
  const reward = unclaimedReward(progress, eventId, prize)
  if (!reward) return null
  progress.claimed.push(eventId)
  save.coins += reward.coins || 0
  progress.xp += reward.xp || 0
  const level = 1 + Math.floor(progress.xp / hero.progression.xpStep)
  if (level > progress.level) {
    progress.level = level
    progress.hp = heroStats(hero, progress).hp
  }
  if (reward.item)
    progress.inventory.push(reward.item)
  if (reward.item && !save.collection.includes(reward.item))
    save.collection.push(reward.item)
  if (reward.achievement && !save.achievements.includes(reward.achievement))
    save.achievements.push(reward.achievement)
  if (reward.flag) progress.flags[reward.flag] = 1
  return reward
}
