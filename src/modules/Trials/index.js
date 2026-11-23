import { useTranslations } from 'next-intl'
import { Dices, Layers } from 'lucide-react'

import { useGame } from '@/store/game'

import Action from '@/components/Action'

import Blackjack from './Blackjack'
import Dice from './Dice'

import style from './index.module.scss'

const Trials = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const busy = useGame((state) => state.busy)
  const event = node.side ? progress.side.game : progress.event
  const cards = node.type === 'blackjack'
  const Icon = cards ? Layers : Dices
  const play = (action, index) => command({ type: 'play', action, index })

  const result = event.result && (
    <div className={style.result}>
      <h2>{t(`results.${event.result}`)}</h2>
      <p className={style.description}>{t(`trials.${node.side ? 'side' : 'main'}${event.result}`)}</p>
      <Action disabled={busy} onClick={() => command({ type: 'advance' })}>
        {t('story.continue')}
      </Action>
    </div>
  )

  return (
    <article className={style.block}>
      <header className={style.heading}>
        <Icon className={style.icon} size={30} strokeWidth={1.4} aria-hidden />
        {node.side && <p className={style.description}>{t('story.side')}</p>}
        <h1 className={style.title}>{t(`nav.${node.type}`)}</h1>
        <p className={style.description}>{t(`rules.${node.type}`)}</p>
        {node.side && <p className={style.description}>{t(`trials.camp.${hero.campaignId}`)}</p>}
      </header>
      {cards ? (
        <Blackjack event={event} play={play} busy={busy} result={result} />
      ) : (
        <>
          <Dice event={event} play={play} busy={busy} />
          {result}
        </>
      )}
    </article>
  )
}

export default Trials
