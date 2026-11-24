import { useId } from 'react'
import { useTranslations } from 'next-intl'
import {
  ChevronRight,
  Coins,
  Dices,
  Flame,
  Footprints,
  Gem,
  Layers,
  Lock,
  ScrollText,
  Swords,
} from 'lucide-react'

import { canChoose } from '@/game/core/story'

import Action from '@/components/Action'

import style from './index.module.scss'

const icons = {
  battle: Swords,
  blackjack: Layers,
  dice: Dices,
  coin: Coins,
  negotiate: ScrollText,
  corrupt: Flame,
  useArtifact: Gem,
  distract: Flame,
  sneak: Footprints,
}

const ChallengeSelection = ({ options, progress, busy, onSelect, camp = false }) => {
  const t = useTranslations()
  const descriptionId = useId()

  return (
    <ul className={style.choices} aria-label={t('story.choice')}>
      {options.map((action) => {
        const available = canChoose(action, progress)
        const Icon = icons[action.id] || ScrollText
        const key = action.title ? `chronicle.actions.${action.title}` : null
        const label = t(camp ? `challenge.games.${action.game}` : key ? `${key}.name` : `choice.${action.id}`)
        const description = camp ? 'challenge.campStakes' : key ? `${key}.effect` : `story.choiceEffect.${action.id}`
        const detail = available ? t(description) : t(`requirements.${action.id}`)
        const coins = action.trialRewards?.win?.coins
        const id = `${descriptionId}-${action.id}`
        const Indicator = available ? ChevronRight : Lock

        return (
          <li className={style.choice} key={action.id}>
            <Action
              className={style.choiceButton}
              variant="secondary"
              data-primary={!!action.game}
              data-locked={!available}
              disabled={!available || busy}
              aria-label={label}
              aria-describedby={id}
              onClick={() => onSelect(action.id)}
            >
              <span className={style.choiceIcon} aria-hidden>
                <Icon size={19} />
              </span>
              <span className={style.choiceName}>{label}</span>
              <span className={style.requirement} id={id}>
                {detail}
                {available && coins !== undefined && ` ${t('challenge.winCoins', { coins })}`}
              </span>
              <Indicator className={style.choiceArrow} size={16} aria-hidden />
            </Action>
          </li>
        )
      })}
    </ul>
  )
}

export default ChallengeSelection
