const coin = (region, [light, shade]) => ({
  edge: [light, shade],
  heads: `/art/coins/${region}/heads.webp`,
  tails: `/art/coins/${region}/tails.webp`,
})

export const coinThemes = {
  erebor: coin('erebor', ['#d8a450', '#4b2d18']),
  shire: coin('shire', ['#be8854', '#452719']),
  gondor: coin('gondor', ['#c0d1d7', '#354852']),
  elven: coin('elven', ['#c1d7b5', '#293e34']),
  mordor: coin('mordor', ['#8d747b', '#201b23']),
  numenor: coin('numenor', ['#d8bb6d', '#4b4636']),
  fallback: coin('fallback', ['#c1a279', '#3c291e']),
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
