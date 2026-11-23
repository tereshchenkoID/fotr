import { useTranslations } from 'next-intl'
import { Layers, Orbit } from 'lucide-react'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { handValue, natural } from '@/game/minigames/blackjack'

import Action from '@/components/Action'

import style from './index.module.scss'

const cardDelay = 115
const cardArrival = 390
const dealDuration = () => cardDelay * 3 + cardArrival + 40

const PlayingCard = ({ card, hidden, order, dealing }) => {
  const t = useTranslations('trials')
  return (
    <span
      className={style.card}
      data-dealing={dealing}
      style={
        dealing
          ? {
              '--deal-delay': `${order * cardDelay}ms`,
              '--deal-time': `${cardArrival}ms`,
            }
          : undefined
      }
      role="img"
      aria-label={hidden ? t('hidden') : `${card.rank} ${card.suit}`}
    >
      <span aria-hidden className={style.cardInner} data-covered={hidden}>
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
  )
}

const Hand = ({ cards, dealer, covered, dealing }) => {
  const t = useTranslations('trials')
  const count = covered ? handValue(cards.slice(0, 1)) : handValue(cards)
  const showScore = cards.length > 0 && !dealing

  return (
    <section className={style.hand} data-dealer={dealer}>
      <h2 className={style.handTitle}>
        {t(dealer ? 'dealer' : 'player')}
        {showScore && (
          <span className={style.score} aria-live="polite">
            {!covered && natural(cards) ? t('natural') : count}
          </span>
        )}
      </h2>
      <div className={style.cards}>
        {cards.map((card, index) => (
          <PlayingCard
            key={index}
            card={card}
            hidden={covered && index === 1}
            order={index * 2 + Number(dealer)}
            dealing={dealing}
          />
        ))}
        {cards.length === 0 && (
          <>
            <span className={style.empty} aria-hidden />
            <span className={style.empty} aria-hidden />
          </>
        )}
      </div>
    </section>
  )
}

const Blackjack = ({ event, play, busy, result }) => {
  const t = useTranslations('trials')
  const started = event.player.length > 0
  const dealing = !!useTurnAnimation(event, Number(started), dealDuration)
  const locked = busy || dealing
  return (
    <>
      <div className={style.block} aria-busy={dealing}>
        <Hand
          cards={event.dealer}
          dealer
          covered={!event.result || dealing}
          dealing={dealing}
        />
        <div className={style.divider} aria-hidden>
          <span className={style.deck}>
            <Orbit size={22} strokeWidth={1.35} />
          </span>
        </div>
        <Hand cards={event.player} dealing={dealing} />
      </div>
      {dealing || !event.result ? (
        <div className={style.actions}>
          {!started || dealing ? (
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
