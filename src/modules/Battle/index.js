import { useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Flame, HelpCircle, Lock, Shield, Skull, Sparkles, Sword, Zap
} from 'lucide-react'

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

const statusIcons = { burn: Flame, lock: Lock, curse: Skull, weaken: Sword, shift: Sparkles, shield: Shield }

const BattleAction = ({ label, icon: Icon, reason, onClick }) => (
  <Action
    className={style.option}
    variant="secondary"
    aria-disabled={!!reason}
    aria-label={reason ? `${label}. ${reason}` : undefined}
    title={reason}
    onClick={reason ? undefined : onClick}
  >
    {Icon && <Icon size={16} aria-hidden />}
    {label}
  </Action>
)

const Combatant = ({ name, portrait, hp, max, title, effect, reaction, phaseEffect, revision, figures, defeatedLabel, statuses, hit }) => (
  <div className={style.combatant} data-critical={reaction === 'critical'}>
    <div className={style.portrait}>
      <Image className={style.portraitImage}
        src={portrait}
        alt=""
        fill
        sizes="(max-width: 768px) 40vw, 230px"
      />
      {effect && <CombatEffect key={`effect-${revision}`} effect={effect} reaction={reaction} />}
      {hit && <span className={style.hit} key={`hit-${revision}`} aria-hidden />}
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
      {statuses.length > 0 && (
        <ul className={style.status}>
          {statuses.map(([id, value, label]) => {
            const Icon = statusIcons[id]
            return (
              <li key={id} className={style.statusItem} title={label} tabIndex={0}>
                {Icon && <Icon size={15} aria-hidden />}
                <span aria-hidden>{value}</span><span className={style.statusLabel}>{label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
    <h2 className={style.combatantName}>{name}</h2>
    <Meter className={style.health} label={title} value={hp} max={max} kind="health" />

  </div>
)

const Battle = ({ hero, progress, node, command }) => {
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
  const statuses = Object.entries(battle.statuses)
    .filter(([, value]) => value > 0)
    .map(([id, value]) => [id, value, `${t(`statuses.${id}`)} · ${value}`])
  const playerStatuses = statuses.filter(([id]) => id !== 'weaken')
  if (battle.shield > 0) playerStatuses.push(['shield', battle.shield, t('battle.shield', { value: battle.shield })])
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
  const ability = hero.abilities[0]
  const locked = busy || !!before || !!battle.result || battle.cinematic
  const shortage = (value) => battle.focus < value ? t('combatUi.focus', { value }) : null
  const blocked = locked ? t('combatUi.busy') : null
  const enemyName = t(`enemies.${battle.enemyId}`)
  const play = (action, index) =>
    command({ type: 'play', action, index, turn: battle.turn })

  return (
    <VisualScene className={style.block} visuals={visuals}>
      <header className={style.heading}>
        <h1 className={style.title}>{locations[progress.location].names[locale]}</h1>
        <p className={style.encounter}>{node.boss && `${t('battle.boss')} · `}{enemyName}</p>
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
            statuses={victory ? [] : playerStatuses}
            hit={activeFeedback?.damage > 0}
          />
        </div>
        <div className={style.enemy}>
          <Combatant
            name={enemyName}
            portrait={enemyArt[battle.enemyId] || art.enemy}
            hp={battle.enemyHp}
            max={enemy.hp}
            title={t('game.hp')}
            effect={effects[enemyReaction]}
            reaction={enemyReaction}
            phaseEffect={phaseEffect}
            revision={revision}
            figures={figures(['attack'])}
            statuses={victory ? [] : statuses.filter(([id]) => id === 'weaken')}
            hit={activeFeedback?.attack > 0}
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
              <div className={style.actionGroup} role="group" aria-label={t('combatUi.combat')}>
                <BattleAction
                  label={`${t(`heroes.${hero.id}.ability`)} · ${ability.cost}`}
                  reason={blocked || (battle.cooldown ? t('battle.cooldown', { value: battle.cooldown }) : shortage(ability.cost))}
                  icon={Zap}
                  onClick={() => play('ability')}
                />
                <BattleAction
                  label={t('battle.guard')}
                  reason={blocked || shortage(2) || (battle.shield >= 40 ? t('combatUi.shieldFull') : null)}
                  onClick={() => play('guard')}
                />
              </div>
              <div className={style.actionGroup} role="group" aria-label={t('combatUi.reel')}>
                <BattleAction label={t('battle.reroll')} reason={blocked || shortage(3)} onClick={() => play('reroll')} />
                <BattleAction
                  label={t('battle.convert')}
                  reason={blocked || shortage(3) || (battle.held.length === 2 ? t('combatUi.holdLimit') : null)
                    || (convertTarget(battle) < 0 ? t('combatUi.transformBlocked') : null)}
                  onClick={() => play('convert')}
                />
              </div>
            </div>
          )}
          {!victory && (
            <div className={style.details}>
              {(battle.log || activeFeedback?.phaseChanged) && (
                <div className={style.log} aria-live="polite">
                  {activeFeedback?.critical && <strong className={style.notice}>{t('combatFeedback.critical')} · </strong>}
                  {activeFeedback?.phaseChanged && <strong className={style.notice}>{t('combatFeedback.phase')} · </strong>}
                  {battle.log && t('battle.log', battle.log)}
                </div>
              )}
              {!before && battle.matches.length > 0 && (
                <ul className={style.matches}>
                  {battle.matches.map(({ line, symbol, count }) => {
                    const effect = hero.slotConfig.pool.find(({ id }) => id === symbol)?.effect
                    if (!effect) return null
                    return (
                      <li className={style.match} key={line} data-effect={effect}>
                        {t('combatUi.line', { line: line + 1, symbol: t(`symbols.${symbol}`), count,
                          effect: t(`combatUi.${effect === 'focus' ? 'focusEffect' : effect}`) })}
                      </li>
                    )
                  })}
                </ul>
              )}
              <details className={style.help}>
                <summary className={style.helpToggle}><HelpCircle size={15} aria-hidden />{t('combatUi.help')}</summary>
                <p className={style.log}>{t('rules.battle')}</p>
                <p className={style.log}>{t('battle.rerollHelp')}</p>
              </details>
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
