import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Dices, Flag } from 'lucide-react'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import {
  diceCount,
  duelRounds,
  duelTotals,
  sumDice,
} from '@/game/minigames/dice'

import Action from '@/components/Action'

import TrialOutcome from '../TrialOutcome'

import style from './index.module.scss'

const pipsByValue = [
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
]

const timing = (index) => 425 + index * 36
const throwDuration = () => timing(diceCount - 1) + 40
const roundDuration = () => throwDuration() * 2 + 120

const DiceHand = ({ name, portrait, dice, rolling, total }) => {
  const t = useTranslations('duel')
  return (
    <section className={style.hand} aria-busy={rolling}>
      <header className={style.participant}>
        {portrait && (
          <Image
            className={style.portrait}
            src={portrait}
            alt=""
            width={48}
            height={48}
          />
        )}
        <h2 className={style.name}>{name}</h2>
        <span className={style.total}>{t('total', { score: total })}</span>
      </header>
      <div className={style.dice}>
        {Array.from({ length: diceCount }, (_, index) => {
          const value = dice?.[index]
          const pips = pipsByValue[value - 1]
          return (
            <div key={index} className={style.die} data-rolling={rolling}>
              {pips ? (
                <span
                  className={style.face}
                  role={rolling ? undefined : 'img'}
                  aria-hidden={rolling}
                  aria-label={t('face', { value })}
                  style={{
                    '--roll-time': `${timing(index)}ms`,
                    '--roll-direction': index % 2 === 0 ? 1 : -1,
                  }}
                >
                  <span className={style.pips} aria-hidden>
                    {pips.map((pip) => (
                      <span
                        className={style.pip}
                        key={pip}
                        style={{
                          gridArea: `${Math.floor(pip / 3) + 1} / ${(pip % 3) + 1}`,
                        }}
                      />
                    ))}
                  </span>
                </span>
              ) : (
                <span className={style.placeholder} aria-hidden />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const Dice = ({ event, play, busy, material, opponent, heroName, result }) => {
  const t = useTranslations('duel')
  const number = event.rounds.length
  const [initialRound] = useState(number)
  const playerThrow = useTurnAnimation(event, number, throwDuration)
  const resolving = useTurnAnimation(event, number, roundDuration)
  const rolling = !!resolving
  const outcome = rolling ? null : event.result
  const previous = resolving?.rounds ?? event.rounds
  const round = event.ready ? null : event.rounds.at(-1)
  const totals = duelTotals(previous)
  const playerScore = round && !playerThrow ? sumDice(round.player) : null
  const opponentScore = round && !rolling ? sumDice(round.opponent) : null
  const roundNumber = number + Number(event.ready)
  const lead = totals.player - totals.opponent
  const difference = opponentScore === null ? null : playerScore - opponentScore

  return (
    <>
      <div className={style.block} data-dice={material}>
        <DiceHand
          name={opponent.name}
          portrait={opponent.portrait}
          dice={playerThrow ? null : round?.opponent}
          rolling={rolling && !playerThrow}
          total={totals.opponent}
        />
        <div className={style.round}>
          <p className={style.roundTitle}>
            {roundNumber > duelRounds
              ? t('extra', { round: roundNumber })
              : t('round', { round: roundNumber || 1, total: duelRounds })}
          </p>
          <div
            className={style.roundScore}
            aria-live="polite"
            data-compared={difference !== null && number > initialRound}
          >
            <span className={style.scoreSide}>
              {playerScore ?? '–'}
              <small>{heroName}</small>
            </span>
            <span aria-hidden>:</span>
            <span className={style.scoreSide}>
              {opponentScore ?? '–'}
              <small>{opponent.name}</small>
            </span>
          </div>
          <div className={style.roundMeta}>
            <p className={style.summary} aria-live="polite">
              {rolling
                ? t(playerThrow ? 'playerRolling' : 'opponentRolling')
                : difference === null
                  ? t('awaiting')
                  : difference === 0
                    ? t('roundTie')
                    : t(difference > 0 ? 'roundWin' : 'roundLoss', {
                        difference: Math.abs(difference),
                      })}
            </p>
            {previous.length > 0 && (
              <p className={style.leader}>
                <Flag size={14} aria-hidden />
                {lead === 0
                  ? t('tied')
                  : t(lead > 0 ? 'playerLeads' : 'opponentLeads', {
                      difference: Math.abs(lead),
                    })}
              </p>
            )}
          </div>
        </div>
        <DiceHand
          name={heroName}
          dice={round?.player}
          rolling={!!playerThrow}
          total={totals.player}
        />
        <TrialOutcome outcome={outcome} />
      </div>
      {outcome ? (
        result
      ) : (
        <div className={style.actions}>
          <Action
            disabled={busy || rolling}
            onClick={() => play(event.ready ? 'roll' : 'next')}
          >
            <Dices size={17} aria-hidden />
            {t(event.ready || rolling ? 'roll' : 'next')}
          </Action>
        </div>
      )}
      {previous.length > 0 && (
        <table className={style.history}>
          <caption className={style.historyTitle}>{t('history')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('roundColumn')}</th>
              <th scope="col">{heroName}</th>
              <th scope="col">{opponent.name}</th>
            </tr>
          </thead>
          <tbody>
            {previous.map(({ player, opponent }, index) => (
              <tr key={index}>
                <th scope="row">{index + 1}</th>
                <td>{sumDice(player)}</td>
                <td>{sumDice(opponent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default Dice
