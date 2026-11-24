import { useLayoutEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Layers, Orbit } from 'lucide-react'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { trialTurn } from '@/game/core/session'
import { handValue, natural } from '@/game/minigames/blackjack'

import Action from '@/components/Action'

import TrialOutcome from '../TrialOutcome'

import {
  cardArrival,
  cardArrivalDelay,
  getDealDuration,
  getRevealDelay,
} from './motion'

import style from './index.module.scss'

const PlayingCard = ({ card, hidden, delay }) => {
  const t = useTranslations('trials')
  return (
    <span
      className={style.card}
      data-dealing={delay !== null}
      style={
        delay !== null
          ? {
              '--deal-delay': `${delay}ms`,
              '--deal-time': `${cardArrival}ms`,
            }
          : undefined
      }
      role="img"
      aria-label={hidden ? t('hidden') : `${card.rank} ${card.suit}`}
    >
      <span className={style.flight} data-flight={delay !== null} aria-hidden>
      <span className={style.cardInner} data-covered={hidden}>
        <span className={style.back}>
          <Orbit className={style.mark} size={26} strokeWidth={1.3} />
        </span>
        {!hidden && (
          <span
            className={style.face}
            data-red={card.suit === '♥' || card.suit === '♦'}
          >
            <span className={style.corner}>
              <b>{card.rank}</b>
              <span>{card.suit}</span>
            </span>
            <span className={style.suit}>{card.suit}</span>
            <span className={style.corner}>
              <b>{card.rank}</b>
              <span>{card.suit}</span>
            </span>
          </span>
        )}
      </span>
      </span>
    </span>
  )
}

const Hand = ({ event, before, dealer, dealerName, waitingReveal }) => {
  const t = useTranslations('trials')
  const key = dealer ? 'dealer' : 'player'
  const cards = event[key]
  const shown = before || event
  const covered = dealer && (!event.result || waitingReveal)
  const visible = dealer && !shown.result ? shown[key].slice(0, 1) : shown[key]
  const total = handValue(visible)
  const tone = natural(visible) ? 'natural' : total > 21 ? 'bust' : undefined

  return (
    <section className={style.hand} data-dealer={dealer} data-tone={tone}>
      <h2 className={style.handTitle}>
        {dealer ? dealerName : t('player')}
        {shown[key].length > 0 && (
          <span className={style.score} aria-live="polite">
            {total}{tone && ` · ${t(tone)}`}
          </span>
        )}
      </h2>
      <div className={style.cards}>
        {cards.map((card, index) => (
          <PlayingCard key={index} card={card} hidden={covered && index === 1}
            delay={cardArrivalDelay(before, event, dealer, index)} />
        ))}
        {cards.length === 0 && (
          <><span className={style.empty} aria-hidden /><span className={style.empty} aria-hidden /></>
        )}
      </div>
    </section>
  )
}

const Blackjack = ({ event, play, busy, result, visuals, dealerName, dealerKey = visuals.table }) => {
  const t = useTranslations('trials')
  const started = event.player.length > 0
  const turn = trialTurn('blackjack', event)
  const before = useTurnAnimation(event, turn, getDealDuration, true)
  const waitingReveal = !!useTurnAnimation(event, turn, getRevealDelay, true)
  const dealing = !!before
  const outcome = dealing ? null : event.result
  const locked = busy || dealing
  const deck = useRef(null)
  const table = useRef(null)

  useLayoutEffect(() => {
    if (!dealing) return
    const origin = deck.current.getBoundingClientRect()
    for (const flight of table.current.querySelectorAll('[data-flight="true"]')) {
      const target = flight.parentElement.getBoundingClientRect()
      flight.style.setProperty('--flight-x', `${origin.left + origin.width / 2 - target.left - target.width / 2}px`)
      flight.style.setProperty('--flight-y', `${origin.top + origin.height / 2 - target.top - target.height / 2}px`)
    }
  }, [dealing])

  return (
    <>
      <div ref={table} className={style.block} aria-busy={dealing} data-card-back={visuals.theme.material}>
        <Hand event={event} before={before} dealer dealerName={dealerName || t(`dealers.${dealerKey}`)} waitingReveal={waitingReveal} />
        <div className={style.divider}>
          <span className={style.deck} ref={deck} aria-hidden><Orbit size={22} strokeWidth={1.35} /></span>
          <div className={style.verdict}><TrialOutcome outcome={outcome} /></div>
        </div>
        <Hand event={event} before={before} />
      </div>
      {!outcome ? (
        <div className={style.actions}>
          {!started || (before && !before.player.length) ? (
            <Action disabled={locked} onClick={() => play('deal')}>
              <Layers size={17} aria-hidden />
              {t('deal')}
            </Action>
          ) : (
            <>
              <Action disabled={locked} onClick={() => play('hit')}>
                {t('hit')}
              </Action>
              <Action
                disabled={locked}
                variant="secondary"
                onClick={() => play('stand')}
              >
                {t('stand')}
              </Action>
            </>
          )}
        </div>
      ) : (
        result
      )}
    </>
  )
}

export default Blackjack
