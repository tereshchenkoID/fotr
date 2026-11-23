import { useTranslations } from 'next-intl'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { diceCount, scoreDice } from '@/game/minigames/dice'

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

const timing = (index) => 490 + index * 32

const getRollDuration = (before) => {
  const last = Array.from({ length: diceCount }).findLastIndex(
    (_, index) => !before.held.includes(index)
  )
  return last < 0 ? 0 : timing(last) + 40
}

const Die = ({
  value,
  held,
  rolling,
  index,
  disabled,
  onHold,
  label,
}) => {
  const pips = pipsByValue[value - 1]
  return (
    <button
      className={style.die}
      type="button"
      disabled={disabled}
      aria-pressed={held}
      aria-label={label}
      onClick={onHold}
      data-rolling={rolling}
    >
      {pips ? (
        <span
          className={style.face}
          aria-hidden="true"
          style={{
            '--roll-time': `${timing(index)}ms`,
            '--roll-direction': index % 2 === 0 ? 1 : -1,
          }}
        >
          <span className={style.pips}>
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
        <span className={style.placeholder} aria-hidden="true" />
      )}
    </button>
  )
}

const Dice = ({ event, play, busy, material, result }) => {
  const t = useTranslations()
  const before = useTurnAnimation(event, -event.rolls, getRollDuration)
  const shown = before || event
  const locked = !!before || busy || !!event.result
  const score = shown.dice.length ? scoreDice(shown.dice) : null
  const outcome = before ? null : event.result

  return (
    <>
      <div className={style.block} aria-busy={!!before} data-dice={material} data-success={!!score && score.score + shown.modifier >= 24}>
        {Array.from({ length: diceCount }, (_, index) => {
          const held = shown.held.includes(index)
          return (
            <Die
              key={index}
              value={event.dice[index]}
              held={held}
              rolling={!!before && !held}
              index={index}
              disabled={locked || !score}
              label={
                score
                  ? t('trials.die', {
                      index: index + 1,
                      value: shown.dice[index],
                    })
                  : t('trials.unrolledDie', { index: index + 1 })
              }
              onHold={() => play('hold', index)}
            />
          )
        })}
        <TrialOutcome outcome={outcome} />
      </div>
      <p className={style.score} key={shown.rolls} aria-live="polite">
        {score ? (
          <>
            {t(`diceCombinations.${score.combination}`)} ·{' '}
            {t('trials.score', {
              score: score.score + shown.modifier,
              modifier: shown.modifier,
            })}
          </>
        ) : (
          t('trials.awaitingRoll')
        )}
      </p>
      {outcome && result}
      {!event.result && (
        <div className={style.actions}>
          <Action
            disabled={locked || !event.rolls || event.held.length === diceCount}
            onClick={() => play('roll')}
          >
            {t(score ? 'trials.roll' : 'trials.firstRoll', {
              count: shown.rolls,
            })}
          </Action>
          {score && (
            <Action
              disabled={locked}
              variant="secondary"
              onClick={() => play('score')}
            >
              {t('trials.lockScore')}
            </Action>
          )}
        </div>
      )}
    </>
  )
}

export default Dice
