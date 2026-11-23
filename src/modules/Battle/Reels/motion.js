export const reelDuration = (column) => 630 + column * 135

export const buildReelStrip = (previous, result, pool, column, turn) => {
  const filler = Array.from(
    { length: 10 + column * 3 },
    (_, index) =>
      pool[(index + Math.floor(index / 3) + column + turn) % pool.length].id
  )
  const landingRow = 1
  const initialRow = landingRow + result.length + filler.length

  return {
    symbols: [filler[0], ...result, ...filler, ...previous],
    landingRow,
    initialRow,
  }
}
