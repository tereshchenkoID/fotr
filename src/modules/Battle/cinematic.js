import { getReelSpinDuration } from './Reels/motion.js'

const heroScenes = {
  thorin: { style: 'orcrist', relic: 'orcrist' },
  legolas: { style: 'volley', relic: 'arrows' },
  sauron: { style: 'dominion', relic: 'oneRing' },
  frodo: { style: 'stealth', relic: 'sting' },
  gandalf: { style: 'staff', relic: 'staff' },
}

const bossScenes = {
  dragon: { style: 'embers', effect: 'ember' },
  balrog: { style: 'fracture', effect: 'blade' },
  azog: { style: 'iron', effect: 'stone' },
}

export const heroScene = (hero, visuals) => {
  const custom = heroScenes[hero.id]
  const relic = custom?.relic || hero.jackpot.symbol
  return {
    style: custom?.style || 'relic',
    relic,
    sigil: relic !== hero.jackpot.symbol ? hero.jackpot.symbol : null,
    effect: visuals.effects.jackpot,
  }
}

export const victoryScene = (enemy, boss) =>
  boss
    ? bossScenes[enemy] || { style: 'iron', effect: 'stars' }
    : { style: 'fall' }

export const jackpotLine = (battle, jackpot) =>
  battle.cinematic &&
  battle.matches.find(
    ({ symbol, count }) => symbol === jackpot.symbol && count >= jackpot.count
  )

export const battleSequence = (previous, result, boss, reduced, compact) => {
  const spun = result.turn === previous.turn + 1
  const acted =
    result.turn === previous.turn &&
    result.feedback?.revision === (previous.feedback?.revision ?? 0) + 1
  if ((!spun && !acted) || reduced) return []

  const spin = spun ? getReelSpinDuration(previous) : 0
  const steps = spin ? [{ stage: 'spin', duration: spin }] : []
  if (result.cinematic) {
    steps.push(
      { stage: 'anticipation', duration: 660 },
      { stage: 'cinematic', duration: compact ? 770 : 1120 }
    )
  }
  if (result.feedback?.attack || result.feedback?.damage) {
    steps.push({ stage: 'impact', duration: result.cinematic ? 460 : 205 })
  }
  steps.push({ stage: 'recovery', duration: result.cinematic ? 360 : 150 })
  if (result.feedback?.phaseChanged)
    steps.push({ stage: 'phase', duration: 460 })
  if (result.result === 'win')
    steps.push({
      stage: 'victory',
      duration: boss ? (compact ? 980 : 1350) : 420,
    })
  return steps
}

export const statusChanges = (before, after) =>
  before
    ? [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(
      (id) => {
        if ((after[id] || 0) > (before[id] || 0))
          return [{ id, duration: after[id] }]
        if (before[id] > 0 && !after[id]) return [{ id, duration: 0 }]
        return []
      }
    )
    : []
