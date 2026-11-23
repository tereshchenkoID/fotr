import Image from 'next/image'

import style from './index.module.scss'

const VisualScene = ({ visuals, className, children }) => {
  const { palette, material } = visuals.theme
  const [accent, frame, surface, shine, glow] = palette
  return (
    <article
      className={`${style.block} ${className}`}
      data-campaign={visuals.campaign}
      data-light={visuals.light}
      data-material={material}
      data-table={visuals.table}
      data-boss={visuals.boss}
      style={{
        '--accent': accent,
        '--theme-frame': frame,
        '--theme-surface': surface,
        '--theme-shine': shine,
        '--theme-glow': glow,
      }}
    >
      <div className={style.scenery} aria-hidden>
        <Image
          className={style.image}
          src={visuals.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className={style.haze} />
      </div>
      {children}
    </article>
  )
}

export default VisualScene
