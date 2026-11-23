export const cardDelay = 115
export const cardArrival = 390
export const dealerRevealTime = 350

export const getRevealDelay = (before, after) => {
  if (!after.result) return 0
  if (!before.player.length) return 3 * cardDelay + cardArrival
  return after.player.length > before.player.length ? cardArrival : 0
}

export const cardArrivalDelay = (before, after, dealer, index) => {
  if (!before) return null
  if (!before.player.length) return (index * 2 + Number(dealer)) * cardDelay
  if (!dealer) return index >= before.player.length ? 0 : null
  if (index < before.dealer.length) return null
  const revealDelay = getRevealDelay(before, after) + dealerRevealTime
  return revealDelay + (index - before.dealer.length) * cardDelay
}

export const getDealDuration = (before, after) => {
  const lastPlayer = cardArrivalDelay(
    before,
    after,
    false,
    after.player.length - 1
  )
  const lastDealer = cardArrivalDelay(
    before,
    after,
    true,
    after.dealer.length - 1
  )
  return (
    Math.max(
      lastPlayer === null ? 0 : lastPlayer + cardArrival,
      lastDealer === null ? 0 : lastDealer + cardArrival,
      after.result ? getRevealDelay(before, after) + dealerRevealTime : 0
    ) + 45
  )
}
