export const diceCount = 5
export const diceRollLimit = 3

const rollDie = (random) => Math.floor(random() * 6) + 1

export const startDice = (modifier = 0) => ({
  dice: [],
  held: [],
  rolls: diceRollLimit,
  modifier,
  result: null,
})

export const scoreDice = (dice) => {
  const groups = Object.values(
    dice.reduce((counts, face) => {
      counts[face] = (counts[face] || 0) + 1
      return counts
    }, {})
  ).sort((a, b) => b - a)
  const sum = dice.reduce((total, digit) => total + digit, 0)
  if (groups[0] === 5) return { combination: 'five', score: sum + 30 }
  if (groups[0] === 4) return { combination: 'four', score: sum + 18 }
  if (groups[0] === 3 && groups[1] === 2)
    return { combination: 'house', score: sum + 15 }
  if (groups.length === 5 && Math.max(...dice) - Math.min(...dice) === 4)
    return { combination: 'straight', score: sum + 16 }
  if (groups[0] === 3) return { combination: 'three', score: sum + 9 }
  if (groups[0] === 2 && groups[1] === 2)
    return { combination: 'twoPair', score: sum + 7 }
  if (groups[0] === 2) return { combination: 'pair', score: sum + 4 }
  return { combination: 'high', score: sum }
}

export const playDice = (game, action, index, random = Math.random) => {
  if (game.result) return game
  const hasRolled = game.dice.length === diceCount
  if (
    hasRolled &&
    action === 'hold' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < diceCount
  ) {
    const held = game.held.includes(index)
      ? game.held.filter((die) => die !== index)
      : [...game.held, index]
    return { ...game, held }
  }
  if (action === 'roll' && game.rolls > 0 && game.held.length < diceCount) {
    return {
      ...game,
      rolls: game.rolls - 1,
      dice: Array.from({ length: diceCount }, (_, position) =>
        game.held.includes(position) ? game.dice[position] : rollDie(random)
      ),
    }
  }
  if (hasRolled && action === 'score') {
    const { combination, score } = scoreDice(game.dice)
    const total = score + game.modifier
    return {
      ...game,
      combination,
      score: total,
      result: total >= 24 ? 'win' : 'loss',
    }
  }
  return game
}
