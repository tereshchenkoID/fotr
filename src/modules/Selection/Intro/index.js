import style from './index.module.scss'

const Intro = ({ title, text, children }) => (
  <header className={style.block}>
    <h1 className={style.introTitle}>{title}</h1>
    <p className={style.introText}>{text}</p>
    {children && <div className={style.actions}>{children}</div>}
  </header>
)

export default Intro
