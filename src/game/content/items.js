export const items = {
  waystone: {
    id: 'waystone',
    glyph: 'Gem',
    rarity: 'common',
    effects: { defense: 2 },
  },
  ember: {
    id: 'ember',
    glyph: 'Flame',
    rarity: 'rare',
    effects: { attack: 3, magic: 2 },
  },
  seal: {
    id: 'seal',
    glyph: 'Sparkles',
    rarity: 'rare',
    effects: { focus: 2 },
  },
  westStar: {
    id: 'westStar',
    glyph: 'Sparkles',
    rarity: 'rare',
    effects: { attack: 2, defense: 2 },
  },
  mountainKey: {
    id: 'mountainKey',
    glyph: 'Gem',
    rarity: 'rare',
    effects: { defense: 3, focus: 1 },
  },
  brightSeal: {
    id: 'brightSeal',
    glyph: 'Flame',
    rarity: 'rare',
    effects: { magic: 3, hp: 6 },
  },
  dominion: {
    id: 'dominion',
    glyph: 'Gem',
    rarity: 'legendary',
    effects: { magic: 4, focus: 1 },
  },
  crown: {
    id: 'crown',
    glyph: 'Crown',
    rarity: 'legendary',
    effects: { hp: 12, defense: 2, magic: 3 },
  },
}

export const enemies = {
  scout: { hp: 47, attack: 12, defense: 2, phases: [] },
  trolls: {
    hp: 52,
    attack: 13,
    defense: 2,
    phases: [{ at: 0.5, effect: 'burn', attack: 3 }],
  },
  goblins: { hp: 49, attack: 12, defense: 2, phases: [] },
  spider: {
    hp: 68,
    attack: 12,
    defense: 3,
    phases: [
      { at: 0.7, effect: 'lock', attack: 1 },
      { at: 0.32, effect: 'curse', attack: 2 },
    ],
  },
  wrath: {
    hp: 77,
    attack: 13,
    defense: 3,
    phases: [
      { at: 0.68, effect: 'curse', attack: 1 },
      { at: 0.3, effect: 'lock', attack: 3 },
    ],
  },
  vanguard: {
    hp: 82,
    attack: 14,
    defense: 3,
    phases: [
      { at: 0.68, effect: 'lock', attack: 1 },
      { at: 0.3, effect: 'burn', attack: 3 },
    ],
  },
  balrog: {
    hp: 84,
    attack: 14,
    defense: 3,
    phases: [
      { at: 0.65, effect: 'burn', attack: 1 },
      { at: 0.32, effect: 'curse', attack: 3 },
    ],
  },
  dragon: {
    hp: 86,
    attack: 14,
    defense: 4,
    phases: [
      { at: 0.7, effect: 'burn', attack: 2 },
      { at: 0.34, effect: 'shift', attack: 3 },
    ],
  },
  warlord: {
    hp: 80,
    attack: 13,
    defense: 4,
    phases: [
      { at: 0.7, effect: 'lock', attack: 2 },
      { at: 0.3, effect: 'shift', attack: 3 },
    ],
  },
  wardens: {
    hp: 82,
    attack: 14,
    defense: 3,
    phases: [
      { at: 0.66, effect: 'shift', attack: 2 },
      { at: 0.31, effect: 'curse', attack: 3 },
    ],
  },
}

export const achievements = [
  'first',
  'cards',
  'dice',
  'battle',
  'jackpot',
  'side',
  'finished',
]
