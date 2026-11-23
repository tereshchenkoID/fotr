import style from './index.module.scss'

const count = {
  arrows: 5,
  'arrow-storm': 7,
  leaves: 6,
  ember: 7,
  hammer: 3,
  blade: 3,
  stars: 6,
  runes: 4,
  stone: 5,
  veil: 4,
  'dark-ring': 3,
  shield: 3,
}

const CombatEffect = ({ effect, reaction, large = false }) => (
  <div
    className={style.block}
    data-effect={effect}
    data-reaction={reaction}
    data-large={large}
    aria-hidden
  >
    {Array.from({ length: count[effect] || 3 }, (_, index) => (
      <span
        key={index}
        className={style.particle}
        style={{ '--particle': index, '--count': count[effect] || 3 }}
      />
    ))}
  </div>
)

export default CombatEffect
