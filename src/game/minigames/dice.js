export const diceCount = 5
export const duelRounds = 3

export const sumDice = (dice) => dice.reduce((sum, face) => sum + face, 0)

export const duelTotals = (rounds) =>
  rounds.reduce(
    (totals, { player, opponent }) => ({
      player: totals.player + sumDice(player),
      opponent: totals.opponent + sumDice(opponent),
    }),
    { player: 0, opponent: 0 }
  )

export const duelResult = (rounds) => {
  if (rounds.length < duelRounds) return null
  const { player, opponent } = duelTotals(rounds)
  if (player === opponent) return null
  return player > opponent ? 'win' : 'loss'
}

export const startDice = () => ({ rounds: [], ready: true, result: null })

export const playDice = (game, action, random = Math.random) => {
  if (game.result) return game
  if (action === 'next' && !game.ready) return { ...game, ready: true }
  if (action !== 'roll' || !game.ready) return game

  const roll = () =>
    Array.from({ length: diceCount }, () => Math.floor(random() * 6) + 1)
  const rounds = [...game.rounds, { player: roll(), opponent: roll() }]
  return { rounds, ready: false, result: duelResult(rounds) }
}
