import { useTranslations } from 'next-intl'
import { Trophy } from 'lucide-react'

import { achievements } from '@/game/content/items'

import Inventory from './Inventory'
import Profile from './Profile'

import style from './index.module.scss'

const Achievements = ({ save }) => {
  const t = useTranslations()
  return (
    <div className={style.grid}>
      {achievements.map((id) => (
        <section
          key={id}
          className={style.panel}
          data-locked={!save.achievements.includes(id)}
        >
          <Trophy className={style.icon} size={24} aria-hidden />
          <h2>{t(`achievements.${id}`)}</h2>
          <p className={style.description}>
            {t(
              `inventory.${save.achievements.includes(id) ? 'unlocked' : 'locked'}`
            )}
          </p>
        </section>
      ))}
    </div>
  )
}

const Journal = ({ scene, ...props }) => {
  const t = useTranslations('nav')
  if (scene === 'profile') return <Profile {...props} />
  const Content = scene === 'inventory' ? Inventory : Achievements
  return (
    <article className={style.block}>
      <h1 className={style.title}>{t(scene)}</h1>
      <Content {...props} />
    </article>
  )
}

export default Journal
