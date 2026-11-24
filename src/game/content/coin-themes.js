const face = (hero, symbol) => `/art/symbols/${hero}/${symbol}.webp`

const coin = (metal, heads, tails, rim) => ({ metal, heads, tails, rim })

export const coinThemes = {
  erebor: coin(
    ['#ffe1a1', '#a77532', '#442a17'],
    face('thorin', 'shield'),
    face('thorin', 'hammer'),
    'angular'
  ),
  shire: coin(
    ['#e0bb87', '#8f5e36', '#442719'],
    face('bilbo', 'charm'),
    face('bilbo', 'key'),
    'plain'
  ),
  gondor: coin(
    ['#e8f4f6', '#859ba3', '#354852'],
    face('aragorn', 'banner'),
    face('aragorn', 'crown'),
    'beaded'
  ),
  elven: coin(
    ['#e5f3d0', '#7e9f77', '#293e34'],
    face('elrond', 'wreath'),
    face('elrond', 'seal'),
    'beaded'
  ),
  mordor: coin(
    ['#b4a19d', '#51464d', '#201b23'],
    face('sauron', 'eye'),
    face('sauron', 'darkRune'),
    'angular'
  ),
  numenor: coin(
    ['#f5dea3', '#a28a59', '#4b4636'],
    face('galadriel', 'shell'),
    face('aragorn', 'crown'),
    'beaded'
  ),
  fallback: coin(
    ['#f7d498', '#9c7745', '#3c291e'],
    face('aragorn', 'star'),
    face('gimli', 'stone'),
    'plain'
  ),
}

const regionalCoins = {
  erebor: 'erebor',
  five: 'erebor',
  khazad: 'erebor',
  lake: 'erebor',
  shire: 'shire',
  bree: 'shire',
  trollshaws: 'shire',
  minas: 'gondor',
  ithilien: 'gondor',
  amon: 'gondor',
  rivendell: 'elven',
  lorien: 'elven',
  lindon: 'elven',
  eregion: 'elven',
  mordor: 'mordor',
  doom: 'mordor',
  gate: 'mordor',
  cirith: 'mordor',
  moria: 'mordor',
  numenor: 'numenor',
}

export const resolveCoinTheme = (location) =>
  coinThemes[regionalCoins[location]] || coinThemes.fallback
