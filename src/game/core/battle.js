import { enemies, items } from '../content/items.js'
import {
  findCombinations,
  generateGrid,
  isReelFixed,
  spinEffects,
} from '../minigames/slots.js'

export const heroStats = (hero, progress) => {
  const stats = {
    ...hero.stats,
    hp: hero.stats.hp + (progress.level - 1) * hero.progression.hpPerLevel,
    focus: 0,
  }
  if (hero.id === 'sauron')
    stats.magic += Math.min(4, progress.flags.corruption || 0)
  for (const id of progress.equipped) {
    for (const [key, value] of Object.entries(items[id].effects))
      stats[key] += value
  }
  return stats
}

export const startBattle = (hero, progress, enemyId, random) => {
  const stats = heroStats(hero, progress)
  const enemy = enemies[enemyId]
  const pool = hero.slotConfig.pool
  return {
    enemyId,
    hp: progress.hp,
    enemyHp: enemy.hp,
    maxHp: stats.hp,
    focus: Math.min(10, 2 + stats.focus),
    grid: generateGrid(pool, random),
    turn: 0,
    matches: [],
    held: [],
    phase: 0,
    statuses: {},
    cooldown: 0,
    shield: 0,
    result: null,
    cinematic: false,
    log: null,
  }
}

const damageEnemy = (battle, damage) => {
  const enemy = enemies[battle.enemyId]
  const enemyHp = Math.max(0, battle.enemyHp - damage)
  const phases = enemy.phases.filter(({ at }) => enemyHp <= enemy.hp * at)
  const statuses = { ...battle.statuses }
  for (const phase of phases.slice(battle.phase)) statuses[phase.effect] = 2
  return {
    ...battle,
    enemyHp,
    phase: phases.length,
    statuses,
    result: enemyHp ? null : 'win',
  }
}

const applyEffects = (
  battle,
  effects,
  stats,
  random,
  damageLimit = Infinity
) => {
  const bonus = effects.critical && random() < 0.35 ? effects.critical : 0
  const damage = (effects.damage || 0) + (effects.magic || 0) + bonus
  const next = damageEnemy(battle, Math.min(damage, damageLimit))
  return {
    ...next,
    criticalHit: !!bonus,
    hp: Math.min(stats.hp, battle.hp + (effects.heal || 0)),
    shield: Math.min(40, battle.shield + (effects.shield || 0)),
    focus: Math.min(10, battle.focus + (effects.focus || 0)),
    statuses: {
      ...next.statuses,
      weaken: Math.max(next.statuses.weaken || 0, effects.curse || 0),
    },
  }
}

const withFeedback = (before, after, action, effects = {}) => {
  const { criticalHit, ...battle } = after
  return {
    ...battle,
    feedback: {
      revision: (before.feedback?.revision ?? 0) + 1,
      action,
      critical: !!criticalHit,
      attack: before.enemyHp - after.enemyHp,
      damage: effects.damage ?? 0,
      blocked: effects.blocked ?? 0,
      healing: effects.healing ?? Math.max(0, after.hp - before.hp),
      focus: Math.max(0, after.focus - before.focus),
      shield: effects.shield ?? Math.max(0, after.shield - before.shield),
      phaseChanged: after.phase > before.phase && after.enemyHp > 0,
    },
  }
}

export const convertTarget = ({ grid, held, statuses }) =>
  grid.findIndex((_, index) => !isReelFixed(index, held, statuses) && !(statuses.shift > 0 && index === 4))

const tick = (battle, hero, stats, random, quick = false) => {
  const grid = generateGrid(
    hero.slotConfig.pool,
    random,
    battle.grid,
    battle.held,
    battle.statuses
  )
  const matches = findCombinations(grid)
  const { effects, jackpot } = spinEffects(matches, hero)
  const enemy = enemies[battle.enemyId]
  const weakened = battle.statuses.weaken > 0
  const cursed = battle.statuses.curse > 0
  const burn = battle.statuses.burn > 0 ? 4 : 0
  const base = Math.max(1, stats.attack - enemy.defense - (cursed ? 3 : 0))
  const ownDamage =
    base + effects.damage + (effects.magic ? effects.magic + stats.magic : 0)
  const statuses = Object.fromEntries(
    Object.entries(battle.statuses).flatMap(([id, count]) =>
      count > 1 ? [[id, count - 1]] : []
    )
  )
  const gains = {
    ...effects,
    damage: ownDamage,
    magic: 0,
    focus: effects.focus + 1,
  }
  if (jackpot) {
    for (const [id, value] of Object.entries(hero.jackpot.effect)) {
      gains[id] = (gains[id] || 0) + value
    }
  }
  if (quick) gains.focus = 0
  const damageLimit =
    enemy.phases.length > 1 && battle.phase === 0
      ? Math.floor(enemy.hp * 0.56)
      : Infinity
  const next = applyEffects(
    {
      ...battle,
      grid,
      matches,
      held: [],
      turn: battle.turn + 1,
      statuses,
      cooldown: Math.max(0, battle.cooldown - 1),
      cinematic: jackpot,
    },
    gains,
    stats,
    random,
    damageLimit
  )
  const phaseAttack = enemy.phases
    .slice(0, battle.phase)
    .reduce((total, phase) => total + phase.attack, 0)
  const incoming =
    next.result === 'win' || quick
      ? 0
      : Math.max(
        1,
        enemy.attack + phaseAttack - stats.defense - (weakened ? 5 : 0)
      ) + burn
  const damage = Math.max(0, incoming - next.shield)
  const hp = Math.max(0, next.hp - damage)
  return withFeedback(battle, {
    ...next,
    hp,
    shield: Math.max(0, next.shield - incoming),
    result: hp ? next.result : 'loss',
    log: { attack: battle.enemyHp - next.enemyHp, damage },
  }, quick ? 'reroll' : 'attack', {
    damage,
    blocked: Math.min(next.shield, incoming),
    healing: Math.max(0, next.hp - battle.hp),
    shield: Math.max(0, next.shield - battle.shield),
  })
}

export const playBattle = (
  battle,
  hero,
  progress,
  action,
  column,
  random = Math.random
) => {
  if (action === 'dismiss' && battle.cinematic)
    return { ...battle, cinematic: false }
  if (battle.result || battle.cinematic) return battle
  const stats = heroStats(hero, progress)
  const ability = hero.abilities[0]
  if (action === 'spin') return tick(battle, hero, stats, random)
  if (action === 'guard' && battle.focus >= 2 && battle.shield < 40) {
    return withFeedback(battle, {
      ...battle,
      focus: battle.focus - 2,
      shield: Math.min(40, battle.shield + 12),
    }, 'guard')
  }
  if (
    action === 'ability' &&
    battle.focus >= ability.cost &&
    !battle.cooldown
  ) {
    const next = applyEffects(
      {
        ...battle,
        focus: battle.focus - ability.cost,
        cooldown: ability.cooldown,
      },
      ability.effect,
      stats,
      random
    )
    return withFeedback(battle, {
      ...next,
      log: { attack: battle.enemyHp - next.enemyHp, damage: 0 },
    }, 'ability')
  }
  if (
    action === 'hold' &&
    Number.isInteger(column) &&
    column >= 0 &&
    column < 5
  ) {
    if (battle.held.includes(column)) {
      return {
        ...battle,
        held: battle.held.filter((index) => index !== column),
        focus: Math.min(10, battle.focus + 2),
      }
    }
    if (!isReelFixed(column, battle.held, battle.statuses) && battle.focus >= 2 && battle.held.length < 2) {
      return {
        ...battle,
        held: [...battle.held, column],
        focus: battle.focus - 2,
      }
    }
  }
  if (action === 'convert' && battle.focus >= 3 && battle.held.length < 2) {
    const target = convertTarget(battle)
    if (target < 0) return battle
    const grid = battle.grid.map((reel, index) =>
      index === target ? [reel[0], hero.slotConfig.pool[1].id, reel[2]] : reel
    )
    return withFeedback(battle, {
      ...battle,
      grid,
      held: [...battle.held, target],
      focus: battle.focus - 3,
      matches: [],
    }, 'convert')
  }
  if (action === 'reroll' && battle.focus >= 3)
    return tick(
      { ...battle, focus: battle.focus - 3 },
      hero,
      stats,
      random,
      true
    )
  return battle
}
