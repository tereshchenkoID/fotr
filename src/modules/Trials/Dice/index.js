import { useTranslations } from 'next-intl'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { diceCount, scoreDice } from '@/game/minigames/dice'

import Action from '@/components/Action'

import style from './index.module.scss'

const faces = [
  { x: 0, y: 0, pips: [4] },
  { x: -90, y: 0, pips: [0, 8] },
  { x: 0, y: 90, pips: [0, 4, 8] },
  { x: 0, y: -90, pips: [0, 2, 6, 8] },
  { x: 90, y: 0, pips: [0, 2, 4, 6, 8] },
  { x: 180, y: 0, pips: [0, 2, 3, 5, 6, 8] },
]

const timing = (index) => 510 + index * 58

const getRollDuration = (before) => {
  const last = Array.from({ length: diceCount }).findLastIndex(
    (_, index) => !before.held.includes(index)
  )
  return last < 0 ? 0 : timing(last) + 40
}

const Die = ({
  value,
  previous,
  held,
  rolling,
  index,
  disabled,
  onHold,
  label,
  turn,
}) => {
  const face = faces[value - 1]
  const from = previous ? faces[previous - 1] : faces[0]
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
      {face ? (
        <span
          className={style.lift}
          aria-hidden="true"
          key={rolling ? turn : 'rest'}
          style={{
            '--roll-time': `${timing(index)}ms`,
            '--roll-direction': index % 2 === 0 ? 1 : -1,
            '--from-x': `${-from.x}deg`,
            '--from-y': `${-from.y}deg`,
            '--to-x': `${-face.x}deg`,
            '--to-y': `${-face.y}deg`,
          }}
        >
          <span className={style.cube}>
            {faces.map(({ x, y, pips }, faceIndex) => (
              <span
                className={style.face}
                key={faceIndex}
                style={{ '--face-x': `${x}deg`, '--face-y': `${y}deg` }}
              >
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
            ))}
          </span>
        </span>
      ) : (
        <span className={style.placeholder} aria-hidden="true" />
      )}
    </button>
  )
}

const Dice = ({ event, play, busy }) => {
  const t = useTranslations()
  const before = useTurnAnimation(event, -event.rolls, getRollDuration)
  const shown = before || event
  const locked = !!before || busy || !!event.result
  const score = shown.dice.length ? scoreDice(shown.dice) : null

  return (
    <>
      <div className={style.block} aria-busy={!!before}>
        {Array.from({ length: diceCount }, (_, index) => {
          const held = shown.held.includes(index)
          return (
            <Die
              key={index}
              value={event.dice[index]}
              previous={shown.dice[index]}
              held={held}
              rolling={!!before && !held}
              index={index}
              disabled={locked || !score}
              turn={event.rolls}
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
      </div>
      <p className={style.score} aria-live="polite">
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
