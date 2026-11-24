import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { FastForward } from 'lucide-react'

import { symbolFallback } from '@/game/content/visual-themes'

import Action from '@/components/Action'
import RewardSummary from '@/components/RewardSummary'

import CombatEffect from '../CombatEffect'

import style from './index.module.scss'

const JackpotCinematicController = ({
  hero,
  visuals,
  scene,
  phase,
  enemy,
  enemyName,
  reward,
  disabled,
  onContinue,
  feedback,
  changes,
  onSkip,
}) => {
  const t = useTranslations()
  const victory = phase === 'victory'
  const impact = phase === 'impact' || phase === 'recovery'
  const exitLabel = t('battle.skip')
  const headline = victory ? t('results.win') : t(`heroes.${hero.id}.jackpot`)
  const relic = visuals.symbols[scene.relic]?.image || symbolFallback
  const figures = ['attack', 'blocked', 'healing', 'shield', 'focus'].filter(
    (id) => feedback?.[id] > 0
  )

  return (
    <section
      className={style.block}
      data-scene={scene.style}
      data-phase={phase}
      aria-label={headline}
    >
      <div className={style.stage} aria-hidden>
        <Image
          className={style.subject}
          src={victory ? enemy : hero.portrait}
          alt=""
          fill
          sizes="(max-width: 600px) 85vw, 640px"
          loading="eager"
        />
        {!victory && (
          <>
            <Image
              className={style.target}
              src={enemy}
              alt=""
              fill
              sizes="(max-width: 600px) 42vw, 320px"
            />
            {scene.sigil && visuals.symbols[scene.sigil] && (
              <Image
                className={style.sigil}
                src={visuals.symbols[scene.sigil].image}
                alt=""
                width={84}
                height={84}
              />
            )}
            <Image
              className={style.relic}
              src={relic}
              alt=""
              width={152}
              height={152}
              onError={({ currentTarget }) => {
                if (!currentTarget.src.endsWith(symbolFallback))
                  currentTarget.src = symbolFallback
              }}
            />
          </>
        )}
        <div className={style.atmosphere} />
        {scene.effect && (
          <CombatEffect
            effect={scene.effect}
            large
            reaction={victory ? 'victory' : undefined}
          />
        )}
      </div>
      <div className={style.copy}>
        <h2 className={style.title}>{headline}</h2>
        {!victory && !impact && (
          <p className={style.description}>
            {t(`heroes.${hero.id}.cinematic`)}
          </p>
        )}
        {impact && (
          <ul className={style.chips} aria-live="polite">
            {feedback?.critical && <li>{t('combatFeedback.critical')}</li>}
            {figures.map((id) => (
              <li key={id}>
                {t(`combatFeedback.${id}`, { value: feedback[id] })}
              </li>
            ))}
            {changes
              .filter(({ duration }) => duration > 0)
              .map(({ id, duration }) => (
                <li key={id}>
                  {t(`statuses.${id}`)} · {duration}
                </li>
              ))}
          </ul>
        )}
        {victory && (
          <>
            <p className={style.bossName}>{enemyName}</p>
            <div className={style.victoryActions}>
              <RewardSummary reward={reward} />
              <Action disabled={disabled} onClick={onContinue}>
                {t('battle.spoils')}
              </Action>
            </div>
          </>
        )}
      </div>
      {!victory && <Action
        variant="secondary"
        className={style.skip}
        onClick={onSkip}
        aria-label={exitLabel}
        title={exitLabel}
      >
        <FastForward size={17} aria-hidden />
        <span className={style.skipLabel}>{exitLabel}</span>
      </Action>}
    </section>
  )
}

export default JackpotCinematicController
