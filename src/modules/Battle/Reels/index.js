import { preload } from 'react-dom'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react'

import { symbolFallback } from '@/game/content/visual-themes'
import { isReelFixed } from '@/game/minigames/slots'

import { buildReelStrip, reelDuration } from './motion'

import style from './index.module.scss'

const isFixed = (battle, column) =>
  isReelFixed(column, battle.held, battle.statuses)

export const getReelSpinDuration = (before) => {
  const last = before.grid.findLastIndex(
    (_, column) => !isFixed(before, column)
  )
  return last < 0 ? 0 : reelDuration(last) + 40
}

const ReelCell = ({ asset, label, winner }) => (
  <div
    className={style.cell}
    data-winner={winner}
    data-rarity={asset.rarity}
    title={label}
    role={label ? 'img' : undefined}
    aria-label={label}
  >
    <Image
      className={style.symbol}
      src={asset.image}
      alt=""
      width={128}
      height={128}
      loading="eager"
      onError={(event) => {
        const image = event.currentTarget
        if (!image.src.endsWith(symbolFallback)) image.src = symbolFallback
      }}
    />
  </div>
)

const ReelStrip = ({ previous, result, pool, visuals, column, turn }) => {
  const { symbols, initialRow, landingRow } = buildReelStrip(
    previous,
    result,
    pool,
    column,
    turn
  )
  return (
    <div
      className={style.strip}
      aria-hidden
      style={{
        '--travel-rows': initialRow,
        '--landing-row': landingRow,
        '--spin-time': `${reelDuration(column)}ms`,
      }}
    >
      {symbols.map((id, index) => (
        <ReelCell key={index} asset={visuals.symbols[id]} />
      ))}
    </div>
  )
}

const Reels = ({ hero, visuals, result, before, play, locked }) => {
  const t = useTranslations()
  const pool = hero.slotConfig.pool
  for (const { image } of Object.values(visuals.symbols))
    preload(image, { as: 'image' })
  const shown = before || result
  const matches = before ? [] : result.matches
  const highlighted = new Set(matches.flatMap(({ cells }) => cells))

  return (
    <>
      <div className={style.frame} data-frame={visuals.frame}>
        <div className={style.block} aria-busy={!!before}>
          {result.grid.map((reel, column) => {
            const spinning = before && !isFixed(before, column)
            return (
              <div
                className={style.reel}
                key={column}
                data-fixed={isFixed(shown, column)}
                data-affected={
                  shown.statuses.shift > 0 && column === 4
                    ? 'shift'
                    : shown.statuses.burn > 0
                      ? 'burn'
                      : undefined
                }
              >
                <div className={style.reelFaces}>
                  {reel.map((symbol, row) => (
                    <ReelCell
                      key={row}
                      asset={visuals.symbols[symbol]}
                      label={t(`symbols.${shown.grid[column][row]}`)}
                      winner={highlighted.has(`${column}:${row}`)}
                    />
                  ))}
                </div>
                {spinning && (
                  <ReelStrip
                    key={result.turn}
                    previous={before.grid[column]}
                    result={reel}
                    pool={pool}
                    visuals={visuals}
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
                <polyline
                  className={style.line}
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
      </div>
      <div className={style.holds}>
        {shown.grid.map((_, column) => {
          const held = shown.held.includes(column)
          const fixed = !held && isFixed(shown, column)
          return (
            <button
              className={style.hold}
              key={column}
              type="button"
              aria-pressed={held}
              aria-label={t('battle.holdReel', { reel: column + 1 })}
              title={t(fixed ? 'statuses.lock' : 'battle.holdCost')}
              disabled={
                locked ||
                fixed ||
                (!held && (shown.focus < 2 || shown.held.length === 2))
              }
              onClick={() => play('hold', column)}
            >
              {held || fixed ? (
                <LockKeyhole size={16} aria-hidden />
              ) : (
                <LockKeyholeOpen size={16} aria-hidden />
              )}
              <span className={style.holdLabel}>
                {t(`battle.${held || fixed ? 'held' : 'hold'}`)}
              </span>
              {!held && !fixed && <span className={style.cost}>2</span>}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default Reels
