import style from './index.module.scss'

const Meter = ({ label, value, max, className, kind = 'gold' }) => (
  <div className={[style.block, style[kind], className].filter(Boolean).join(' ')}>
    <label>
      <span className={style.caption}>
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </span>
      <progress className={style.progress} value={value} max={max} />
    </label>
  </div>
)

export default Meter
