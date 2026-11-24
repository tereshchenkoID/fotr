import { handValue } from '../minigames/blackjack.js'
import { coinScore } from '../minigames/coin.js'
import { duelTotals } from '../minigames/dice.js'

export const gameTypes = ['battle', 'blackjack', 'dice', 'coin']
export const sideTypes = gameTypes.filter((game) => game !== 'battle')

const sidePrize = {
  coins: 18,
  xp: 25,
  item: 'seal',
  achievement: 'side',
  flag: 'sideComplete',
}

export const campGames = (node) =>
  node.campGames || (node.campTrial ? [node.campTrial] : [])

export const campPrize = (game) =>
  game === 'coin' ? { ...sidePrize, coins: 12 } : sidePrize

const statistics = {
  battle: (event) => ({
    turns: event.turn,
    hp: event.hp,
    enemyHp: event.enemyHp,
  }),
  blackjack: (event) => ({
    player: handValue(event.player),
    opponent: handValue(event.dealer),
  }),
  dice: (event) => ({
    ...duelTotals(event.rounds),
    rounds: event.rounds.length,
  }),
  coin: (event) => ({
    ...coinScore(event.rounds),
    rounds: event.rounds.length,
  }),
}

export const encounterPrize = (rewardNode, game, result) => ({
  ...rewardNode.reward,
  ...(result === 'loss'
    ? { coins: 4 }
    : rewardNode.trialRewards?.[game]?.[result]),
})

export const trialOutcome = (node, event, rewardNode, checkpoint) => {
  const result = event.result
  const retry = node.type === 'battle' && result === 'loss'
  const base = !retry && rewardNode?.reward
  const reward = node.side
    ? result === 'win'
      ? campPrize(node.type)
      : null
    : base && encounterPrize(rewardNode, node.type, result)
  return {
    eventId: node.encounter || node.id,
    game: node.type,
    result,
    stats: statistics[node.type](event),
    reward: reward || null,
    rewardNode: base ? rewardNode.id : null,
    next: node.side ? null : retry ? checkpoint : node.next,
  }
}
