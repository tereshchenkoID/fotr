import { art, locationArt } from './assets.js'
import { heroes } from './heroes.js'
import { campaigns } from './world.js'

const palettes = {
  ember: ['#ffc48e', '#bb6341', '#27181d', '#87452d', '#ff704c'],
  jade: ['#d2edbd', '#759b78', '#172b25', '#315c49', '#c2f58d'],
  gold: ['#ffdc9b', '#b9955e', '#30271e', '#765138', '#ffd986'],
  moss: ['#eadd99', '#949555', '#272d20', '#555f36', '#e7e4a2'],
  violet: ['#eadcff', '#9b8ac2', '#242139', '#594f80', '#d2afff'],
  ivory: ['#e9faff', '#96b7bd', '#23343d', '#4b7178', '#d6fbff'],
  steel: ['#d7e8ff', '#7f96be', '#1c2536', '#405b7a', '#87bcff'],
  copper: ['#ffcca8', '#b87d62', '#33231f', '#775035', '#ffac72'],
  coral: ['#ffd6b6', '#b98161', '#361f25', '#77404a', '#ff8976'],
  teal: ['#c0ffea', '#63978f', '#183034', '#325f62', '#76f5e0'],
}

const identities = {
  frodo: ['moss', 'wood', 'veil', 'veil'],
  aragorn: ['steel', 'steel', 'blade', 'stars'],
  gandalf: ['violet', 'rune', 'runes', 'stars'],
  legolas: ['jade', 'silver', 'arrows', 'arrow-storm'],
  gimli: ['copper', 'stone', 'hammer', 'stone'],
  sam: ['moss', 'leather', 'leaves', 'veil'],
  bilbo: ['gold', 'leather', 'veil', 'leaves'],
  thorin: ['gold', 'stone', 'blade', 'hammer'],
  balin: ['violet', 'stone', 'runes', 'stone'],
  kili: ['coral', 'leather', 'arrows', 'ember'],
  fili: ['gold', 'steel', 'blade', 'ember'],
  dwalin: ['steel', 'stone', 'hammer', 'blade'],
  sauron: ['ember', 'obsidian', 'ember', 'dark-ring'],
  galadriel: ['ivory', 'silver', 'stars', 'runes'],
  elrond: ['steel', 'silver', 'runes', 'leaves'],
  celebrimbor: ['violet', 'steel', 'ember', 'runes'],
  durin: ['teal', 'stone', 'hammer', 'stone'],
  istar: ['ivory', 'rune', 'stars', 'veil'],
}

const defenses = {
  obsidian: 'dark-ring',
  silver: 'leaves',
  stone: 'stone',
  wood: 'veil',
  rune: 'runes',
  leather: 'shield',
  steel: 'shield',
}

export const heroVisuals = Object.fromEntries(
  Object.entries(identities).map(
    ([id, [palette, material, attack, jackpot]]) => {
      const hero = heroes[id]
      return [
        id,
        {
          palette: palettes[palette],
          material,
          frame: material,
          effects: {
            attack,
            critical: attack,
            ability: jackpot,
            guard: defenses[material],
            damage: defenses[material],
            victory: jackpot,
            defeat: attack,
            jackpot,
          },
          jackpotSymbol: hero.jackpot.symbol,
          cinematicRelic: id === 'thorin' ? 'orcrist' : hero.jackpot.symbol,
          symbols: Object.fromEntries(
            hero.slotConfig.pool.map(({ id: symbol }, index) => [
              symbol,
              {
                image: `/art/symbols/${id}/${symbol}.webp`,
                rarity:
                  symbol === hero.jackpot.symbol
                    ? 'signature'
                    : index === 4
                      ? 'rare'
                      : 'common',
              },
            ])
          ),
        },
      ]
    }
  )
)

const campaignVisuals = {
  war: { ambient: 'dusk', table: 'tavern' },
  hobbit: { ambient: 'lantern', table: 'hall' },
  power: { ambient: 'starlight', table: 'elven' },
}

const tableVisuals = {
  tavern: { palette: palettes.gold, material: 'wood' },
  hall: { palette: palettes.copper, material: 'stone' },
  elven: { palette: palettes.ivory, material: 'silver' },
  dark: { palette: palettes.ember, material: 'obsidian' },
}

const painted = (id) => `/art/locations/${id}.webp`
const locations = {
  shire: { image: '/art/war.webp', table: 'tavern', light: 'warm' },
  bree: { table: 'tavern', light: 'warm' },
  weathertop: { table: 'hall', light: 'cold' },
  rivendell: { table: 'elven', light: 'cold' },
  moria: { table: 'dark', light: 'cold' },
  lorien: { table: 'elven', light: 'cool' },
  amon: { table: 'hall', light: 'cold' },
  rohan: { table: 'tavern', light: 'warm' },
  helm: { table: 'hall', light: 'cold' },
  fangorn: { image: '/art/mirkwood.webp', table: 'elven', light: 'cool' },
  minas: { table: 'hall', light: 'warm' },
  marshes: { table: 'dark', light: 'cool' },
  ithilien: { table: 'elven', light: 'cool' },
  cirith: { table: 'dark', light: 'cold' },
  mordor: { table: 'dark', light: 'warm' },
  doom: { image: painted('mordor'), table: 'dark', light: 'warm' },
  gate: { table: 'dark', light: 'cold' },
  trollshaws: { table: 'tavern', light: 'cool' },
  goblins: { table: 'dark', light: 'warm' },
  cave: { table: 'dark', light: 'cold' },
  mirkwood: { table: 'elven', light: 'cool' },
  lake: { table: 'tavern', light: 'cold' },
  erebor: { table: 'hall', light: 'warm' },
  five: { table: 'hall', light: 'cold' },
  numenor: { table: 'hall', light: 'warm' },
  eregion: { table: 'elven', light: 'warm' },
  lindon: { table: 'elven', light: 'warm' },
  khazad: { table: 'hall', light: 'cool' },
  rhun: { table: 'dark', light: 'cold' },
  southlands: { table: 'tavern', light: 'warm' },
}

const locationVariants = {
  'hobbit:rivendell': { light: 'warm' },
  'hobbit:shire': { light: 'cool' },
  'power:mordor': { light: 'cold' },
}

export const symbolFallback = art.symbolFallback
export const phaseEffects = {
  burn: 'ember',
  lock: 'runes',
  shift: 'dark-ring',
  curse: 'veil',
}
const resolveScene = (campaignId, location, node) => {
  const campaign = campaignVisuals[campaignId]
  const setting = {
    ...locations[location],
    ...locationVariants[`${campaignId}:${location}`],
  }
  return {
    campaign: campaign.ambient,
    image:
      setting.image ||
      locationArt[location] ||
      (locations[location] ? painted(location) : campaigns[campaignId].image),
    light: setting.light,
    table:
      node.side && setting.table !== 'dark'
        ? campaign.table
        : setting.table || campaign.table,
    boss: !!node.boss,
  }
}

export const resolveVisuals = (hero, location, node) => ({
  ...resolveScene(hero.campaignId, location, node),
  theme: heroVisuals[hero.id],
})

export const resolveTrialVisuals = (campaignId, location, node) => {
  const scene = resolveScene(campaignId, location, node)
  return { ...scene, theme: tableVisuals[scene.table] }
}
