import { gameTypes } from '../core/trials.js'

import { heroes } from './heroes.js'
import { thorinChapters } from './thorin-story.js'

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

const legacyGames = gameTypes.filter((id) => id !== 'coin')
const settlementTrials = {
  shire: ['dice', 'blackjack'],
  bree: ['dice', 'blackjack'],
  rivendell: ['dice'],
  lake: ['blackjack', 'dice'],
  numenor: ['blackjack', 'dice'],
  rohan: ['dice'],
  minas: ['blackjack'],
  lindon: ['dice'],
  southlands: ['blackjack'],
  eregion: ['blackjack'],
}
const alternatives = {
  shire: ['battle'],
  bree: ['battle'],
  trollshaws: ['dice'],
  goblins: ['dice'],
  southlands: ['battle'],
}

export const chapterKey = (hero, index) => `${hero.storyId}-${index}`

const addChapter = (graph, hero, location, chapter) => {
  const base = chapterKey(hero, chapter)
  const nodeId = (type) => `${base}.${type}`
  const final = chapter === hero.route.length - 1
  const main = routeStyles[hero.id][chapter % 3]
  const majorBoss =
    final ||
    (hero.id === 'gandalf' && location === 'moria') ||
    (hero.id === 'thorin' && location === 'erebor')
  const boss = majorBoss || location === 'mirkwood'
  const enemy = location === 'five'
    ? 'azog'
    : majorBoss ? hero.boss : locationEnemy[location] || 'scout'
  const add = (type, properties) => {
    const id = nodeId(type)
    graph[id] = { id, type, location, chapter, ...properties }
  }
  add('dialogue', { next: nodeId('checkpoint') })
  add('checkpoint', { next: nodeId('choice') })
  const context = settlementTrials[location] || ['battle']
  const paths = boss
    ? ['battle']
    : [...new Set([
        context.includes(main) ? main : context[0],
        ...context,
        ...(alternatives[location] || []),
    ])]
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
  // Keep old encounter IDs loadable even when a new choice no longer offers them.
  for (const type of majorBoss ? ['battle'] : legacyGames) {
    add(type, { enemy, boss: boss && type === 'battle', next: reward, encounter: nodeId('choice') })
  }
  add('reward', {
    next: nodeId(final ? 'end' : 'camp'),
    reward: {
      coins: majorBoss ? 28 : 12,
      xp: majorBoss ? 62 : 30,
      item: final
        ? 'crown'
        : [null, 'ember', campaignRelics[hero.campaignId]][chapter] || null,
      achievement: final ? 'finished' : 'first',
    },
  })
  add('camp', {
    next: nodeId('travel'),
    campTrial: settlementTrials[location]
      ? hero.campaignId === 'war' ? 'blackjack' : 'dice'
      : null,
  })
  add('travel', {
    next: final ? null : `${chapterKey(hero, chapter + 1)}.dialogue`,
  })
  add('end', {})

  const chapterStory = hero.id === 'thorin' && thorinChapters[location]
  if (chapterStory) {
    for (const name of ['dialogue', 'choice', 'reward', 'camp']) {
      graph[nodeId(name)].title = chapterStory.title
    }
    for (const [name, scene] of Object.entries(chapterStory.scenes)) {
      const id = nodeId(name)
      graph[id] = {
        ...graph[id],
        id,
        location,
        chapter,
        title: chapterStory.title,
        ...scene,
        ...(scene.next && { next: nodeId(scene.next) }),
        ...(scene.actions && {
          actions: scene.actions.map((action) => ({
            ...action,
            next: nodeId(action.next),
          })),
        }),
      }
    }
    if (location === 'trollshaws') {
      for (const type of ['blackjack', 'dice']) graph[nodeId(type)].next = nodeId('dawn')
    }
  }
  for (const action of graph[nodeId('choice')].actions) {
    const target = graph[action.next]
    if (!gameTypes.includes(target.type)) continue
    action.game = target.type
    action.trialRewards = graph[target.next]?.trialRewards?.[target.type]
    target.encounter = nodeId('choice')
  }
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
