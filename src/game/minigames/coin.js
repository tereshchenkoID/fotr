export const coinSides = ['heads', 'tails']
export const coinRounds = 3

export const startCoin = () => ({ rounds: [], result: null })

export const coinScore = (rounds) => {
  const player = rounds.filter(({ guess, face }) => guess === face).length
  return { player, opponent: rounds.length - player }
}

export const coinResult = (rounds) => {
  const { player, opponent } = coinScore(rounds)
  return player === 2 ? 'win' : opponent === 2 ? 'loss' : null
}

export const playCoin = (event, guess, random = Math.random) => {
  if (event.result || !coinSides.includes(guess)) return event
  const face = random() < 0.5 ? 'heads' : 'tails'
  const rounds = [...event.rounds, { guess, face }]
  return { rounds, result: coinResult(rounds) }
}
