import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Coins } from 'lucide-react'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { coinRounds, coinScore, coinSides } from '@/game/minigames/coin'

import Action from '@/components/Action'

import style from './index.module.scss'

const tossTime = 1060
const getTossDuration = () => tossTime
const angle = (face) => (face === 'tails' ? 180 : 0)

const CoinScore = ({ name, points, won }) => (
  <div className={style.player} data-winner={!!won}>
    <p>{name}</p>
    <strong className={style.points}>{points}</strong>
    <span className={style.pips} aria-hidden>
      <span className={style.pip} data-filled={points > 0} />
      <span className={style.pip} data-filled={points > 1} />
    </span>
  </div>
)

const Coin = ({ event, play, busy, heroName, opponent, theme, result }) => {
  const t = useTranslations('coin')
  const turn = event.rounds.length
  const before = useTurnAnimation(event, turn, getTossDuration)
  const shown = before || event
  const previous = shown.rounds.at(-1)
  const landing = event.rounds.at(-1)?.face
  const scores = coinScore(shown.rounds)
  const outcome = shown.result
  const [light, shade] = theme.edge

  return (
    <>
      <div className={style.board} data-outcome={outcome || undefined}>
        <p className={style.round}>
          {t('round', { value: outcome ? turn : shown.rounds.length + 1, total: coinRounds })}
        </p>
        <div className={style.score} role="group" aria-label={t('score', scores)}>
          <CoinScore name={heroName} points={scores.player} won={previous && previous.guess === previous.face} />
        <div
          className={style.stage}
          data-rolling={!!before}
          aria-hidden
          style={{
            '--coin-light': light,
            '--coin-shade': shade,
            '--coin-time': `${tossTime}ms`,
            '--coin-start': `${angle(previous?.face)}deg`,
            '--coin-end': `${1440 + angle(landing)}deg`,
            '--coin-rest': `${angle(landing)}deg`,
          }}
        >
          <div className={style.shadow} key={`shadow-${turn}`} />
          <div className={style.flight} key={turn}>
            <div className={style.disc}>
              <span className={style.edge} />
              {coinSides.map((side) => (
                <span className={style.face} data-side={side} key={side}>
                  <Image
                    src={theme[side]}
                    className={style.relief}
                    width={384}
                    height={384}
                    sizes="112px"
                    alt=""
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
          <CoinScore name={opponent} points={scores.opponent} won={previous && previous.guess !== previous.face} />
        </div>
        <p className={style.call} role="status">
          {before
            ? t('tossing')
            : previous
              ? t(previous.guess === previous.face ? 'matched' : 'missed', {
                  face: t(previous.face),
                })
              : t('call')}
        </p>
      </div>
      {outcome ? (
        result
      ) : (
        <div className={style.actions}>
          {coinSides.map((side, index) => (
            <Action
              key={side}
              variant={index === 0 ? 'primary' : 'secondary'}
              disabled={busy || !!before}
              onClick={() => play(side)}
            >
              <Coins className={style.icon} size={16} aria-hidden />
              {t(side)}
            </Action>
          ))}
        </div>
      )}
      {shown.rounds.length > 0 && (
        <ol className={style.history} aria-label={t('history')}>
          {shown.rounds.map(({ guess, face }, index) => (
            <li className={style.entry} key={index} data-match={guess === face}>
              {t('entry', { round: index + 1, guess: t(guess), face: t(face) })}
              <span className={style.point}>
                {guess === face ? heroName : opponent}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

export default Coin
