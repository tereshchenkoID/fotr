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
        campTrial: 'dice',
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
  lake: {
    title: 'lake',
    scenes: {
      blackjack: { dealer: 'lakeTrader' },
      choice: {
        actions: [
          branch('blackjack', 'blackjack'),
          branch('negotiate', 'reward', {
            requires: { reputation: 2 },
            flag: 'accord',
          }),
        ],
      },
    },
  },
}
