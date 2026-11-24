const branch = (id, next, outcome = {}) => ({
  id,
  next,
  ...outcome,
  title: id,
})

export const thorinChapters = {
  trollshaws: {
    title: 'trollshaws',
    scenes: {
      dialogue: { line: 'trollTracks', speaker: 'balin', next: 'firelight' },
      firelight: {
        type: 'dialogue',
        line: 'trollFire',
        speaker: 'bilbo',
        next: 'checkpoint',
      },
      choice: {
        actions: [
          branch('battle', 'battle'),
          branch('distract', 'dawn', { flag: 'trollDistraction' }),
          branch('sneak', 'dawn', {
            requires: { artifact: 'waystone' },
            flag: 'trollSecret',
            reward: { coins: 4 },
          }),
        ],
      },
      battle: { next: 'dawn' },
      dawn: {
        type: 'dialogue',
        line: 'trollDawn',
        lineVariants: [
          { flag: 'trollSecret', line: 'trollHiddenDawn' },
          { flag: 'trollDistraction', line: 'trollStalledDawn' },
        ],
        speaker: 'gandalf',
        next: 'cache',
      },
      cache: {
        type: 'dialogue',
        line: 'trollCache',
        speaker: 'thorin',
        next: 'reward',
        visual: 'trollCache',
      },
      reward: { line: 'trollSpoils', visual: 'trollCache' },
      camp: {
        line: 'trollCamp',
        speaker: 'balin',
        campGames: ['dice', 'blackjack', 'coin'],
        autoRest: true,
      },
    },
  },
  rivendell: {
    title: 'rivendell',
    scenes: {
      dialogue: {
        line: 'elrondWelcome',
        speaker: 'elrond',
        next: 'thorinReserve',
      },
      thorinReserve: {
        type: 'dialogue',
        line: 'thorinReserve',
        speaker: 'thorin',
        next: 'checkpoint',
      },
      choice: {
        actions: [
          branch('showMap', 'elrondRunes', { flag: 'trustElrond' }),
          branch('askBalin', 'balinCounsel', {
            flag: 'trustBalin',
            reward: { xp: 5 },
          }),
        ],
      },
      balinCounsel: {
        type: 'dialogue',
        line: 'balinCounsel',
        speaker: 'balin',
        next: 'elrondRunes',
      },
      elrondRunes: {
        type: 'dialogue',
        line: 'elrondRunes',
        speaker: 'elrond',
        next: 'mountainPass',
        visual: 'moonLetters',
      },
      mountainPass: {
        type: 'dialogue',
        line: 'mountainPass',
        speaker: 'gandalf',
        next: 'reward',
      },
      reward: { line: 'rivendellGift' },
      camp: {
        line: 'rivendellRest',
        speaker: 'elrond',
        campTrial: null,
        autoRest: true,
      },
    },
  },
  goblins: {
    title: 'goblins',
    scenes: {
      dialogue: {
        line: 'goblinBridges',
        speaker: 'balin',
        lineVariants: [{ flag: 'trustBalin', line: 'balinBelow' }],
      },
      reward: { line: 'goblinExit' },
      camp: { line: 'countCompany', speaker: 'dwalin' },
    },
  },
  mirkwood: {
    title: 'mirkwood',
    scenes: {
      dialogue: { line: 'spiderTrail', speaker: 'thorin' },
      reward: { line: 'spiderEscape' },
      camp: { line: 'mirkwoodCamp', speaker: 'bilbo' },
    },
  },
  lake: {
    title: 'lake',
    scenes: {
      dialogue: { line: 'lakeLanding', speaker: 'balin' },
      camp: { line: 'lakeWatch', speaker: 'thorin' },
      blackjack: { dealer: 'lakeTrader' },
      dice: { dealer: 'lakeTrader' },
      reward: { trialRewards: { coin: { win: { coins: 8 } } } },
      coin: {
        type: 'coin',
        dealer: 'lakeTrader',
        next: 'reward',
      },
      choice: {
        actions: [
          branch('blackjack', 'blackjack'),
          branch('dice', 'dice'),
          branch('coin', 'coin'),
          branch('negotiate', 'reward', {
            requires: { reputation: 2 },
            flag: 'accord',
          }),
        ],
      },
    },
  },
  erebor: {
    title: 'erebor',
    scenes: {
      dialogue: {
        line: 'mountainGate',
        speaker: 'thorin',
        lineVariants: [{ item: 'mountainKey', line: 'mountainKeyReady' }],
      },
      reward: { line: 'dragonFallen' },
      camp: { line: 'ereborBanners', speaker: 'balin' },
    },
  },
  five: {
    title: 'five',
    scenes: {
      dialogue: {
        line: 'azogApproach',
        speaker: 'thorin',
        lineVariants: [
          { flag: 'defeated-dragon', line: 'afterSmaug' },
          { completed: 'erebor', line: 'afterSmaug' },
        ],
      },
      reward: { line: 'azogFallen' },
      end: { line: 'thorinPeace' },
    },
  },
}
