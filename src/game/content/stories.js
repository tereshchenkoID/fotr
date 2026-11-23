import { heroes } from './heroes.js'

const routeStyles = {
  frodo: ['dice', 'blackjack', 'battle'],
  aragorn: ['blackjack', 'battle', 'dice'],
  gandalf: ['blackjack', 'battle', 'dice'],
  legolas: ['battle', 'dice', 'blackjack'],
  gimli: ['battle', 'blackjack', 'dice'],
  sam: ['dice', 'blackjack', 'battle'],
  bilbo: ['blackjack', 'dice', 'battle'],
  thorin: ['battle', 'blackjack', 'dice'],
  balin: ['blackjack', 'dice', 'battle'],
  kili: ['battle', 'dice', 'blackjack'],
  fili: ['blackjack', 'battle', 'dice'],
  dwalin: ['battle', 'dice', 'blackjack'],
  sauron: ['blackjack', 'dice', 'battle'],
  galadriel: ['battle', 'blackjack', 'dice'],
  elrond: ['blackjack', 'dice', 'battle'],
  celebrimbor: ['dice', 'blackjack', 'battle'],
  durin: ['dice', 'battle', 'blackjack'],
  istar: ['dice', 'blackjack', 'battle'],
}

const campaignRelics = {
  war: 'westStar',
  hobbit: 'mountainKey',
  power: 'brightSeal',
}

const locationEnemy = {
  trollshaws: 'trolls',
  goblins: 'goblins',
  mirkwood: 'spider',
  moria: 'scout',
  erebor: 'dragon',
}

export const chapterKey = (hero, index) => `${hero.storyId}-${index}`

const addChapter = (graph, hero, location, chapter) => {
  const base = chapterKey(hero, chapter)
  const nodeId = (type) => `${base}.${type}`
  const final = chapter === hero.route.length - 1
  const main = routeStyles[hero.id][chapter % 3]
  const boss =
    final ||
    (hero.id === 'gandalf' && location === 'moria') ||
    (hero.id === 'thorin' && location === 'erebor')
  const enemy = location === 'five'
    ? 'azog'
    : boss ? hero.boss : locationEnemy[location] || 'scout'
  const add = (type, properties) => {
    const id = nodeId(type)
    graph[id] = { id, type, location, chapter, ...properties }
  }
  add('dialogue', { next: nodeId('checkpoint') })
  add('checkpoint', { next: nodeId('choice') })
  const paths = boss
    ? ['battle']
    : [main, ...['battle', 'blackjack', 'dice'].filter((type) => type !== main)]
  const reward = nodeId('reward')
  const actions = paths.map((id) => ({ id, next: nodeId(id) }))
  if (!boss) {
    actions.push(
      {
        id: 'negotiate',
        next: reward,
        requires: { reputation: 2 },
        flag: 'accord',
      },
      {
        id: 'useArtifact',
        next: reward,
        requires: { artifact: 'ember' },
        flag: 'artifact',
      }
    )
    if (hero.id === 'sauron') {
      actions.push({
        id: 'corrupt',
        next: reward,
        requires: { influence: 2 },
        flag: 'forged',
      })
    }
  }
  add('choice', { actions, boss })
  for (const type of paths) {
    add(type, { enemy, boss, next: reward })
  }
  add('reward', {
    next: nodeId(final ? 'end' : 'camp'),
    reward: {
      coins: boss ? 28 : 12,
      xp: boss ? 62 : 30,
      item: final
        ? 'crown'
        : [null, 'ember', campaignRelics[hero.campaignId]][chapter] || null,
      achievement: final ? 'finished' : 'first',
    },
  })
  add('camp', { next: nodeId('travel') })
  add('travel', {
    next: final ? null : `${chapterKey(hero, chapter + 1)}.dialogue`,
  })
  add('end', {})
}

export const stories = Object.fromEntries(
  Object.values(heroes).map((hero) => {
    const graph = {}
    hero.route.forEach((location, chapter) =>
      addChapter(graph, hero, location, chapter)
    )
    return [hero.id, graph]
  })
)
