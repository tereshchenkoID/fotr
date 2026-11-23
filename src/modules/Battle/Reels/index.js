import { useTranslations } from 'next-intl'
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react'

import { isReelFixed } from '@/game/minigames/slots'

import { symbolIcons } from '../symbolIcons'

import style from './index.module.scss'

const isFixed = (battle, column) =>
  isReelFixed(column, battle.held, battle.statuses)
const durationFor = (column) => 630 + column * 135

export const getReelSpinDuration = (before) => {
  const last = before.grid.findLastIndex(
    (_, column) => !isFixed(before, column)
  )
  return last < 0 ? 0 : durationFor(last) + 40
}

const ReelCell = ({ symbol, label, winner, special }) => {
  const Icon = symbolIcons[symbol]
  return (
    <div
      className={style.cell}
      data-winner={winner}
      data-special={special}
      title={label}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <Icon className={style.symbol} aria-hidden />
    </div>
  )
}

const ReelStrip = ({ previous, result, pool, column, turn }) => {
  const filler = Array.from(
    { length: 10 + column * 3 },
    (_, index) =>
      pool[
        (index * index + index + Math.floor(index / 3) + column + turn) %
          pool.length
      ].id
  )
  const strip = [filler[0], ...result, ...filler, ...previous]
  return (
    <div
      className={style.strip}
      aria-hidden="true"
      style={{
        '--travel-rows': strip.length - previous.length,
        '--spin-time': `${durationFor(column)}ms`,
      }}
    >
      {strip.map((symbol, index) => (
        <ReelCell key={index} symbol={symbol} special={symbol === pool[0].id} />
      ))}
    </div>
  )
}

const Reels = ({ hero, result, before, play, locked }) => {
  const t = useTranslations()
  const pool = hero.slotConfig.pool
  const shown = before || result
  const matches = before ? [] : result.matches
  const highlighted = new Set(matches.flatMap(({ cells }) => cells))

  return (
    <>
      <div className={style.block} aria-busy={!!before}>
        {result.grid.map((reel, column) => {
          const spinning = before && !isFixed(before, column)
          return (
            <div
              className={style.reel}
              key={column}
              data-fixed={!!before && !spinning}
            >
              <div className={style.reelFaces}>
                {reel.map((symbol, row) => (
                  <ReelCell
                    key={row}
                    symbol={symbol}
                    label={t(`symbols.${shown.grid[column][row]}`)}
                    winner={highlighted.has(`${column}:${row}`)}
                    special={symbol === pool[0].id}
                  />
                ))}
              </div>
              {spinning && (
                <ReelStrip
                  key={result.turn}
                  previous={before.grid[column]}
                  result={reel}
                  pool={pool}
                  column={column}
                  turn={result.turn}
                />
              )}
            </div>
          )
        })}
        {matches.length > 0 && (
          <svg
            className={style.lines}
            viewBox="0 0 5 3"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {matches.map(({ line, cells }) => (
              <polyline className={style.line}
                key={line}
                pathLength={1}
                points={cells
                  .map((cell) =>
                    cell
                      .split(':')
                      .map((value) => Number(value) + 0.5)
                      .join(',')
                  )
                  .join(' ')}
              />
            ))}
          </svg>
        )}
      </div>
      <div className={style.holds}>
        {shown.grid.map((_, column) => {
          const held = shown.held.includes(column)
          return (
            <button className={style.hold}
              key={column}
              type="button"
              aria-pressed={held}
              aria-label={t('battle.holdReel', { reel: column + 1 })}
              title={t('battle.holdCost')}
              disabled={
                locked ||
                (!held && (shown.focus < 2 || shown.held.length === 2))
              }
              onClick={() => play('hold', column)}
            >
              {held ? (
                <LockKeyhole size={16} aria-hidden />
              ) : (
                <LockKeyholeOpen size={16} aria-hidden />
              )}
              <span className={style.holdLabel}>{t(`battle.${held ? 'held' : 'hold'}`)}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

export default Reels
