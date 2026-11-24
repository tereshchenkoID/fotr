import { useTranslations } from 'next-intl'
import { BookOpen, Coins, Gem } from 'lucide-react'

import style from './index.module.scss'

const RewardSummary = ({ reward, children }) => {
  const t = useTranslations()
  if (!reward) return null
  return (
    <ul className={style.rewards}>
      {reward.coins > 0 && (
        <li className={style.entry}><Coins className={style.icon} size={15} aria-hidden />{t('story.coins', { value: reward.coins })}</li>
      )}
      {reward.xp > 0 && (
        <li className={style.entry}><BookOpen className={style.icon} size={15} aria-hidden />{t('story.xp', { value: reward.xp })}</li>
      )}
      {reward.item && (
        <li className={style.entry}><Gem className={style.icon} size={15} aria-hidden />{t(`items.${reward.item}.name`)}</li>
      )}
      {children}
    </ul>
  )
}

export default RewardSummary
