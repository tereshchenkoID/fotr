import { heroStats } from './battle.js'

export const grant = (save, hero, progress, eventId, reward) => {
  if (progress.claimed.includes(eventId)) return
  progress.claimed.push(eventId)
  save.coins += reward.coins || 0
  progress.xp += reward.xp || 0
  const level = 1 + Math.floor(progress.xp / hero.progression.xpStep)
  if (level > progress.level) {
    progress.level = level
    progress.hp = heroStats(hero, progress).hp
  }
  if (reward.item && !progress.inventory.includes(reward.item))
    progress.inventory.push(reward.item)
  if (reward.item && !save.collection.includes(reward.item))
    save.collection.push(reward.item)
  if (reward.achievement && !save.achievements.includes(reward.achievement))
    save.achievements.push(reward.achievement)
  if (reward.flag) progress.flags[reward.flag] = 1
}
