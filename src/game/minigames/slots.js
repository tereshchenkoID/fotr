export const paylines = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
]

const weightedSymbol = (pool, random) => {
  let draw = random() * pool.reduce((total, symbol) => total + symbol.weight, 0)
  return (pool.find((symbol) => (draw -= symbol.weight) < 0) || pool.at(-1)).id
}

export const isReelFixed = (column, held, status) =>
  held.includes(column) || (column === 2 && status.lock > 0)

export const generateGrid = (
  pool,
  random = Math.random,
  previous = [],
  held = [],
  status = {}
) => {
  const rally = weightedSymbol(pool, random)
  return Array.from({ length: 5 }, (_, column) => {
    if (previous[column] && isReelFixed(column, held, status))
      return previous[column]
    return Array.from({ length: 3 }, () => {
      if (status.shift > 0 && column === 4) return pool[1].id
      const rallyChance = rally === pool[0].id ? 0.07 : 0.24
      return random() < rallyChance ? rally : weightedSymbol(pool, random)
    })
  })
}

export const findCombinations = (grid) =>
  paylines.flatMap((line, lineIndex) => {
    const matches = []
    let column = 0
    while (column < line.length) {
      const start = column
      const symbol = grid[column][line[column]]
      do {
        column++
      } while (column < line.length && grid[column][line[column]] === symbol)
      const count = column - start
      if (count >= 3) {
        matches.push({
          symbol,
          count,
          line: lineIndex,
          cells: line
            .slice(start, column)
            .map((row, offset) => `${start + offset}:${row}`),
        })
      }
    }
    return matches
  })

const power = { damage: 7, heal: 5, shield: 5, focus: 1, magic: 8, curse: 1 }

export const spinEffects = (matches, hero) => {
  const effects = {
    damage: 0,
    shield: 0,
    heal: 0,
    focus: 0,
    magic: 0,
    curse: 0,
  }
  for (const match of matches) {
    const { effect } = hero.slotConfig.pool.find(
      (symbol) => symbol.id === match.symbol
    )
    effects[effect] += power[effect] * (match.count - 2)
  }
  const jackpot = matches.some(
    ({ symbol, count }) =>
      symbol === hero.jackpot.symbol && count >= hero.jackpot.count
  )
  return { effects, jackpot }
}
