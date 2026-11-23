import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Shield, Sword, Zap } from 'lucide-react'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { useGame } from '@/store/game'
import { art, enemyArt } from '@/game/content/assets'
import { enemies } from '@/game/content/items'
import { phaseEffects, resolveVisuals } from '@/game/content/visual-themes'
import { locations } from '@/game/content/world'
import { convertTarget } from '@/game/core/battle'

import Action from '@/components/Action'
import Meter from '@/components/Meter'
import VisualScene from '@/modules/VisualScene'

import CombatEffect from './CombatEffect'
import JackpotCinematicController from './JackpotCinematicController'
import Reels, { getReelSpinDuration } from './Reels'

import style from './index.module.scss'

const Combatant = ({ name, portrait, hp, max, title, effect, reaction, phaseEffect, revision, figures, defeatedLabel }) => (
  <div className={style.combatant} data-critical={reaction === 'critical'}>
    <div className={style.portrait}>
      <Image className={style.portraitImage}
        src={portrait}
        alt=""
        fill
        sizes="(max-width: 768px) 40vw, 230px"
      />
      {effect && <CombatEffect key={`effect-${revision}`} effect={effect} reaction={reaction} />}
      {phaseEffect && <CombatEffect key={`phase-${revision}`} effect={phaseEffect} reaction="phase" />}
      {defeatedLabel && (
        <div className={style.defeated}>
          <span className={style.defeatedLabel}>{defeatedLabel}</span>
        </div>
      )}
      {figures.length > 0 && (
        <ul className={style.figures} key={`figures-${revision}`} aria-live="polite">
          {figures.map(([id, label]) => <li key={id} className={style.figure} data-kind={id}>{label}</li>)}
        </ul>
      )}
    </div>
    <h2 className={style.combatantName}>{name}</h2>
    <Meter label={title} value={hp} max={max} kind="health" />
  </div>
)

const Battle = ({ hero, progress, node, save, command }) => {
  const t = useTranslations()
  const locale = useLocale()
  const visuals = resolveVisuals(hero, progress.location, node)
  const committed = progress.event
  const before = useTurnAnimation(
    committed,
    committed.turn,
    getReelSpinDuration
  )
  const battle = before || committed
  const victory = battle.result === 'win'
  const statuses = Object.entries(battle.statuses).filter(
    ([, value]) => value > 0
  )
  const busy = useGame((state) => state.busy)
  const [initialRevision] = useState(committed.feedback?.revision ?? 0)
  const current = battle.feedback
  const activeFeedback = !before && current?.revision > initialRevision ? current : null
  const figures = (keys) => activeFeedback
    ? keys.filter((id) => activeFeedback[id] > 0).map((id) => [id, t(`combatFeedback.${id}`, { value: activeFeedback[id] })])
    : []
  const revision = activeFeedback?.revision
  const enemy = enemies[battle.enemyId]
  const effects = visuals.theme.effects
  const playerReaction = activeFeedback && (battle.result === 'win' ? 'victory'
    : battle.result === 'loss' ? 'defeat'
      : activeFeedback.action === 'ability' ? 'ability'
        : activeFeedback.blocked || activeFeedback.shield ? 'guard'
          : activeFeedback.damage ? 'damage' : null)
  const enemyReaction = activeFeedback?.attack
    ? activeFeedback.critical ? 'critical' : activeFeedback.action === 'ability' ? 'ability' : 'attack'
    : null
  const phaseEffect = activeFeedback?.phaseChanged && phaseEffects[enemy.phases[battle.phase - 1]?.effect]
  const [autoEnabled, setAutoEnabled] = useState(false)
  const ability = hero.abilities[0]
  const auto = save.settings.autoSpin && autoEnabled
  const locked = busy || !!before || !!battle.result || battle.cinematic
  const play = (action, index) =>
    command({ type: 'play', action, index, turn: battle.turn })

  useEffect(() => {
    if (!auto || locked) return
    const timeout = window.setTimeout(
      () => command({ type: 'play', action: 'spin', turn: battle.turn }),
      battle.turn ? 3100 : 3800
    )
    return () => window.clearTimeout(timeout)
  }, [auto, locked, battle.turn, command])

  return (
    <VisualScene className={style.block} visuals={visuals}>
      <header className={style.heading}>
        <p className={style.caption}>{locations[progress.location].names[locale]}{node.boss && ` · ${t('battle.boss')}`}</p>
        <h1 className={style.title}>{t('nav.battle')}</h1>
        <p className={style.caption}>
          {t('battle.turn', { value: battle.turn })} ·{' '}
          {t('battle.phase', { value: battle.phase + 1 })}
        </p>
      </header>
      <div className={style.arena}>
        <div className={style.hero}>
          <Combatant
            name={t(hero.nameKey)}
            portrait={hero.portrait}
            hp={battle.hp}
            max={battle.maxHp}
            title={t('game.hp')}
            effect={effects[playerReaction]}
            reaction={playerReaction}
            revision={revision}
            figures={figures(['damage', 'healing', 'blocked', 'shield', 'focus'])}
          />
        </div>
        <div className={style.enemy}>
          <Combatant
            name={t(`enemies.${battle.enemyId}`)}
            portrait={enemyArt[battle.enemyId] || art.enemy}
            hp={battle.enemyHp}
            max={enemy.hp}
            title={t('game.hp')}
            effect={effects[enemyReaction]}
            reaction={enemyReaction}
            phaseEffect={phaseEffect}
            revision={revision}
            figures={figures(['attack'])}
            defeatedLabel={victory ? t('battle.defeated') : undefined}
          />
        </div>
        <div className={style.machine}>
          <Meter
            label={t('game.focus')}
            value={battle.focus}
            max={10}
            kind="focus"
          />
          <Reels
            hero={hero}
            visuals={visuals.theme}
            result={committed}
            before={before}
            play={play}
            locked={locked}
          />
          {battle.result && !battle.cinematic ? (
            <div className={style.result}>
              <h2 className={style.resultTitle}>{t(`results.${battle.result}`)}</h2>
              <Action
                className={style.continue}
                disabled={busy}
                onClick={() => command({ type: 'advance' })}
              >
                {t(
                  `battle.${battle.result === 'win' ? 'spoils' : 'checkpoint'}`
                )}
              </Action>
            </div>
          ) : (
            <div className={style.actions}>
              <Action className={style.attack} disabled={locked} onClick={() => play('spin')}>
                <Sword size={16} aria-hidden />
                {t('battle.attack')}
              </Action>
              {save.settings.autoSpin && (
                <Action
                  variant="secondary"
                  onClick={() => setAutoEnabled(!autoEnabled)}
                  disabled={battle.cinematic}
                >
                  {t(`battle.${auto ? 'pause' : 'startAuto'}`)}
                </Action>
              )}
              <Action
                variant="secondary"
                disabled={
                  locked || battle.focus < ability.cost || !!battle.cooldown
                }
                title={battle.cooldown ? t('battle.cooldown', { value: battle.cooldown }) : t('combatFeedback.cost', { value: ability.cost })}
                onClick={() => play('ability')}
              >
                <Zap size={16} aria-hidden />
                {t(`heroes.${hero.id}.ability`)} ·{' '}
                {battle.cooldown
                  ? t('battle.cooldown', { value: battle.cooldown })
                  : ability.cost}
              </Action>
              <Action
                variant="secondary"
                disabled={locked || battle.focus < 2 || battle.shield >= 40}
                title={t('combatFeedback.cost', { value: 2 })}
                onClick={() => play('guard')}
              >
                {t('battle.guard')}
              </Action>
              <Action
                variant="secondary"
                disabled={locked || battle.focus < 3}
                title={t('battle.rerollHelp')}
                onClick={() => play('reroll')}
              >
                {t('battle.reroll')}
              </Action>
              <Action
                variant="secondary"
                disabled={locked || battle.focus < 3 || battle.held.length === 2 || convertTarget(battle) < 0}
                title={t('combatFeedback.cost', { value: 3 })}
                onClick={() => play('convert')}
              >
                {t('battle.convert')}
              </Action>
            </div>
          )}
          {!victory && (
            <div className={style.details}>
              <div className={style.log} aria-live="polite">
                {activeFeedback?.critical && <strong className={style.notice}>{t('combatFeedback.critical')} · </strong>}
                {activeFeedback?.phaseChanged && <strong className={style.notice}>{t('combatFeedback.phase')} · </strong>}
                {battle.log ? t('battle.log', battle.log) : t('rules.battle')}
              </div>
              {(battle.shield > 0 || statuses.length > 0) && (
                <div className={style.status}>
                  {battle.shield > 0 && (
                    <span className={style.statusItem}>
                      <Shield size={15} aria-hidden />
                      {t('battle.shield', { value: battle.shield })}
                    </span>
                  )}
                  {statuses.map(([id, value]) => (
                    <span key={id} className={style.statusItem}>
                      {t(`statuses.${id}`)} · {value}
                    </span>
                  ))}
                </div>
              )}
              {progress.equipped.length > 0 && (
                <p className={style.equipped}>
                  {t('game.equipped')}:{' '}
                  {progress.equipped.map((id) => t(`items.${id}.name`)).join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {battle.cinematic && (
        <JackpotCinematicController
          hero={hero}
          visuals={visuals.theme}
          damage={battle.feedback?.attack ?? battle.log?.attack}
          onDismiss={() => play('dismiss')}
        />
      )}
    </VisualScene>
  )
}

export default Battle
