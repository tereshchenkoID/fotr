import { useTranslations } from 'next-intl'
import {
  Coins, Dices, Layers, Swords 
} from 'lucide-react'

import Action from '@/components/Action'

import style from './index.module.scss'

const icons = { battle: Swords, blackjack: Layers, dice: Dices, coin: Coins }

const ChallengeSelection = ({ options, busy, onSelect, camp = false }) => {
  const t = useTranslations()

  return (
    <ul className={style.games} aria-label={t('challenge.choose')}>
      {options.map(({ id, game, title, trialRewards }) => {
        const Icon = icons[game]
        const coins = trialRewards?.win?.coins
        return (
          <li className={style.game} key={id}>
            <h3 className={style.title}>
              <Icon size={18} className={style.icon} aria-hidden />
              {t(`challenge.games.${game}`)}
            </h3>
            <p className={style.description}>{t(`challenge.rules.${game}`)}</p>
            <p className={style.stakes}>
              {title
                ? t(`chronicle.actions.${title}.effect`)
                : t(
                    camp ? 'challenge.campStakes' : `story.choiceEffect.${game}`
                  )}
              {coins !== undefined && ` ${t('challenge.winCoins', { coins })}`}
            </p>
            <Action
              className={style.start}
              variant="secondary"
              disabled={busy}
              onClick={() => onSelect(id)}
              aria-label={t('challenge.startGame', {
                game: t(`challenge.games.${game}`),
              })}
            >
              {t('challenge.start')}
            </Action>
          </li>
        )
      })}
    </ul>
  )
}

export default ChallengeSelection
