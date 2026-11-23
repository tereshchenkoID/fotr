export const suits = ['♠', '♥', '♣', '♦']
export const ranks = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]

export const makeDeck = (random = Math.random) => {
  const deck = suits.flatMap((suit) => ranks.map((rank) => ({ rank, suit })))
  for (let index = deck.length - 1; index > 0; index--) {
    const draw = Math.floor(random() * (index + 1))
    ;[deck[index], deck[draw]] = [deck[draw], deck[index]]
  }
  return deck
}

export const handValue = (hand) => {
  let total = 0
  let aces = 0
  for (const { rank } of hand) {
    if (rank === 'A') aces++
    total += rank === 'A' ? 11 : Math.min(Number(rank) || 10, 10)
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

export const natural = (hand) => hand.length === 2 && handValue(hand) === 21

export const blackjackOutcome = (player, dealer) => {
  const score = handValue(player)
  const house = handValue(dealer)
  if (score > 21) return 'loss'
  if (natural(player) || natural(dealer)) {
    if (natural(player) && natural(dealer)) return 'draw'
    return natural(player) ? 'win' : 'loss'
  }
  if (house > 21 || score > house) return 'win'
  return score === house ? 'draw' : 'loss'
}

export const startBlackjack = () => ({
  player: [],
  dealer: [],
  deck: [],
  result: null,
})

export const deal = (random) => {
  const [first, hidden, second, shown, ...deck] = makeDeck(random)
  const player = [first, second]
  const dealer = [shown, hidden]
  const result =
    natural(player) || natural(dealer) ? blackjackOutcome(player, dealer) : null
  return { player, dealer, deck, result }
}

export const playBlackjack = (game, action, random = Math.random) => {
  if (game.result) return game
  if (!game.player.length) return action === 'deal' ? deal(random) : game
  if (action !== 'hit' && action !== 'stand') return game
  const deck = [...game.deck]
  const player = [...game.player]
  const dealer = [...game.dealer]
  if (action === 'hit') {
    player.push(deck.shift())
    if (handValue(player) < 21) return { player, dealer, deck, result: null }
  }
  if (handValue(player) <= 21) {
    while (handValue(dealer) < 17) dealer.push(deck.shift())
  }
  return { player, dealer, deck, result: blackjackOutcome(player, dealer) }
}
