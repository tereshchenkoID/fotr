import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Flame,
  HelpCircle,
  Info,
  Lock,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Zap,
} from 'lucide-react'

import { useGame } from '@/store/game'
import { art, enemyArt } from '@/game/content/assets'
import { enemies } from '@/game/content/items'
import { stories } from '@/game/content/stories'
import { phaseEffects, resolveVisuals } from '@/game/content/visual-themes'
import { locations } from '@/game/content/world'
import { convertTarget } from '@/game/core/battle'

import Action from '@/components/Action'
import Meter from '@/components/Meter'
import VisualScene from '@/modules/VisualScene'

import {
  heroScene,
  jackpotLine,
  statusChanges,
  victoryScene,
} from './cinematic'
import CombatEffect from './CombatEffect'
import JackpotCinematicController from './JackpotCinematicController'
import Reels from './Reels'
import { useBattleSequence } from './useBattleSequence'

import style from './index.module.scss'

const statusIcons = {
  burn: Flame,
  lock: Lock,
  curse: Skull,
  weaken: Sword,
  shift: Sparkles,
  shield: Shield,
}

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

const Combatant = ({
  name,
  portrait,
  hp,
  max,
  title,
  caption,
  effect,
  reaction,
  phaseEffect,
  revision,
  figures,
  defeatedLabel,
  statuses,
  hit,
}) => (
  <div className={style.combatant} data-critical={reaction === 'critical'}>
    <div className={style.portrait}>
      <Image
        className={style.portraitImage}
        src={portrait}
        alt=""
        fill
        sizes="(max-width: 719px) 45vw, 230px"
      />
      {effect && (
        <CombatEffect
          key={`effect-${revision}`}
          effect={effect}
          reaction={reaction}
        />
      )}
      {hit && (
        <span className={style.hit} key={`hit-${revision}`} aria-hidden />
      )}
      {phaseEffect && (
        <CombatEffect
          key={`phase-${revision}`}
          effect={phaseEffect}
          reaction="phase"
        />
      )}
      {defeatedLabel && (
        <div className={style.defeated}>
          <span className={style.defeatedLabel}>{defeatedLabel}</span>
        </div>
      )}
      {figures.length > 0 && (
        <ul
          className={style.figures}
          key={`figures-${revision}`}
          aria-live="polite"
        >
          {figures.map(([id, label]) => (
            <li key={id} className={style.figure} data-kind={id}>
              {label}
            </li>
          ))}
        </ul>
      )}
      {statuses.length > 0 && (
        <ul className={style.status}>
          {statuses.map(([id, value, label]) => {
            const Icon = statusIcons[id]
            return (
              <li
                key={id}
                className={style.statusItem}
                title={label}
                tabIndex={0}
              >
                {Icon && <Icon size={15} aria-hidden />}
                <span aria-hidden>{value}</span>
                <span className={style.statusLabel}>{label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
    <div className={style.combatantIdentity}>
      <h2 className={style.combatantName}>{name}</h2>
      {caption && <p className={style.combatantCaption}>{caption}</p>}
    </div>
    <Meter
      className={style.health}
      label={title}
      value={hp}
      max={max}
      kind="health"
    />
  </div>
)

const BattlePopover = ({ className, toggleClassName, label, children, panel }) => {
  const disclosure = useRef(null)

  useEffect(() => {
    const element = disclosure.current
    const dismissOutside = (event) => {
      if (element.open && !element.contains(event.target)) element.open = false
    }
    const dismissOnEscape = (event) => {
      if (event.key !== 'Escape' || !element.open) return
      if (element.contains(document.activeElement)) {
        element.querySelector('summary').focus()
      }
      element.open = false
    }

    document.addEventListener('click', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('click', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [])

  return (
    <details className={className} ref={disclosure}>
      <summary className={toggleClassName} aria-label={label}>
        {children}
      </summary>
      {panel}
    </details>
  )
}

const Battle = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const locale = useLocale()
  const visuals = resolveVisuals(hero, progress.location, node)
  const committed = progress.event
  const sequence = useBattleSequence(committed, node.boss)
  const { stage, before, pending } = sequence
  const spin = stage === 'spin'
  const withholding = ['spin', 'anticipation', 'cinematic', 'impact'].includes(
    stage
  )
  const battle = withholding ? before : committed
  const readyForResult = !pending && !committed.cinematic
  const finished = !!battle.result && readyForResult
  const victory = battle.result === 'win'
  const statuses = Object.entries(battle.statuses)
    .filter(([, value]) => value > 0)
    .map(([id, value]) => [id, value, `${t(`statuses.${id}`)} · ${value}`])
  const playerStatuses = statuses.filter(([id]) => id !== 'weaken')
  if (battle.shield > 0)
    playerStatuses.push([
      'shield',
      battle.shield,
      t('battle.shield', { value: battle.shield }),
    ])
  const busy = useGame((state) => state.busy)
  const acknowledged = useRef(null)
  const current = committed.feedback
  const activeFeedback =
    before && ['impact', 'recovery', 'phase', 'complete'].includes(stage)
      ? current
      : null
  const changes = statusChanges(before?.statuses, committed.statuses)
  const jackpotActive = committed.cinematic && pending
  const figures = (keys) =>
    activeFeedback
      ? keys
        .filter((id) => activeFeedback[id] > 0)
        .map((id) => [
          id,
          t(`combatFeedback.${id}`, { value: activeFeedback[id] }),
        ])
      : []
  const revision = activeFeedback?.revision
  const enemy = enemies[battle.enemyId]
  const effects = visuals.theme.effects
  const playerReaction =
    activeFeedback &&
    (battle.result === 'win'
      ? 'victory'
      : battle.result === 'loss'
        ? 'defeat'
        : activeFeedback.action === 'ability'
          ? 'ability'
          : activeFeedback.blocked || activeFeedback.shield
            ? 'guard'
            : activeFeedback.damage
              ? 'damage'
              : null)
  const enemyReaction = activeFeedback?.attack
    ? activeFeedback.critical
      ? 'critical'
      : activeFeedback.action === 'ability'
        ? 'ability'
        : 'attack'
    : null
  const phaseEffect =
    stage === 'phase' && phaseEffects[enemy.phases[battle.phase - 1]?.effect]
  const ability = hero.abilities[0]
  const locked = busy || pending || !!committed.result || committed.cinematic
  const shortage = (value) =>
    battle.focus < value ? t('combatUi.focus', { value }) : null
  const blocked = locked ? t('combatUi.busy') : null
  const enemyName = t(`enemies.${battle.enemyId}`)
  const play = (action, index) =>
    command({ type: 'play', action, index, turn: committed.turn })

  useEffect(() => {
    if (
      !committed.cinematic ||
      pending ||
      busy ||
      acknowledged.current === committed.turn
    )
      return
    acknowledged.current = committed.turn
    void command({ type: 'play', action: 'dismiss', turn: committed.turn })
  }, [busy, command, committed.cinematic, committed.turn, pending])

  const showingVictory = stage === 'victory'
  const scene = showingVictory
    ? victoryScene(battle.enemyId)
    : jackpotActive && ['cinematic', 'impact', 'recovery'].includes(stage)
      ? heroScene(hero, visuals.theme)
      : null
  const enemyPortrait = enemyArt[battle.enemyId] || art.enemy
  const reward = stories[hero.id][node.next]?.reward
  const spotlight =
    stage === 'anticipation' ? jackpotLine(committed, hero.jackpot) : null

  return (
    <VisualScene className={style.block} visuals={visuals} scenery={false}>
      <header className={style.heading}>
        <div className={style.identity}>
          <h1 className={style.title}>
            {locations[progress.location].names[locale]}
          </h1>
          <p className={style.encounter}>
            {node.boss && `${t('battle.boss')} · `}
            {enemyName}
          </p>
        </div>
        <div className={style.headingActions}>
          <p className={style.caption}>
            {t('battle.turn', { value: battle.turn })}
          </p>
          <BattlePopover
            className={style.rules}
            toggleClassName={style.infoToggle}
            label={t('combatUi.rules')}
            panel={
              <div className={style.rulesPanel}>
                <p>{t('rules.battle')}</p>
                <p>{t('battle.rerollHelp')}</p>
              </div>
            }
          >
            <Info className={style.icon} size={17} aria-hidden />
          </BattlePopover>
        </div>
      </header>
      <div className={style.arena} data-stage={stage} data-boss={!!node.boss}>
        <div className={style.hero}>
          <Combatant
            name={t(hero.nameKey)}
            caption={t('game.resumeLevel', { level: progress.level })}
            portrait={hero.portrait}
            hp={battle.hp}
            max={battle.maxHp}
            title={t('game.hp')}
            effect={effects[playerReaction]}
            reaction={playerReaction}
            revision={revision}
            figures={figures([
              'damage',
              'healing',
              'blocked',
              'shield',
              'focus',
            ])}
            statuses={victory ? [] : playerStatuses}
            hit={activeFeedback?.damage > 0}
          />
        </div>
        <div className={style.enemy}>
          <Combatant
            name={enemyName}
            portrait={enemyPortrait}
            caption={
              node.boss
                ? t('battle.phase', { value: battle.phase + 1 })
                : undefined
            }
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
            defeatedLabel={
              victory && !pending ? t('battle.defeated') : undefined
            }
          />
        </div>
        <div className={style.machine} data-finished={finished}>
          {!finished && (
            <Meter
              label={t('game.focus')}
              value={battle.focus}
              max={10}
              kind="focus"
            />
          )}
          <div className={style.reelStage}>
            <Reels
              hero={hero}
              visuals={visuals.theme}
              result={committed}
              before={spin ? before : null}
              play={play}
              locked={locked}
              showHolds={!finished}
              spotlight={spotlight}
            />
            {scene && (
              <JackpotCinematicController
                hero={hero}
                visuals={visuals.theme}
                enemy={enemyPortrait}
                scene={scene}
                phase={stage}
                feedback={current}
                changes={changes}
                reward={node.boss ? reward : null}
                onSkip={sequence.skip}
              />
            )}
          </div>
          {finished ? (
            <div className={style.result}>
              <div>
                <h2 className={style.resultTitle}>
                  {t(`results.${battle.result}`)}
                </h2>
                {node.boss && victory && reward && (
                  <p className={style.reward}>
                    {t('story.coins', { value: reward.coins })} ·{' '}
                    {t('story.xp', { value: reward.xp })}
                    {reward.item && ` · ${t(`items.${reward.item}.name`)}`}
                  </p>
                )}
              </div>
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
          ) : committed.cinematic && !pending ? (
            <Action
              disabled={busy}
              variant="secondary"
              onClick={() => play('dismiss')}
            >
              {t('battle.skip')}
            </Action>
          ) : (
            <div className={style.actions}>
              <Action
                className={style.attack}
                disabled={locked}
                onClick={() => play('spin')}
              >
                <Sword size={16} aria-hidden />
                {t('battle.attack')}
              </Action>
              <div
                className={style.actionGroup}
                role="group"
                aria-label={t('combatUi.combat')}
              >
                <BattleAction
                  label={`${t(`heroes.${hero.id}.ability`)} · ${ability.cost}`}
                  reason={
                    blocked ||
                    (battle.cooldown
                      ? t('battle.cooldown', { value: battle.cooldown })
                      : shortage(ability.cost))
                  }
                  icon={Zap}
                  onClick={() => play('ability')}
                />
                <BattleAction
                  label={t('battle.guard')}
                  reason={
                    blocked ||
                    shortage(2) ||
                    (battle.shield >= 40 ? t('combatUi.shieldFull') : null)
                  }
                  onClick={() => play('guard')}
                />
              </div>
              <div
                className={style.actionGroup}
                role="group"
                aria-label={t('combatUi.reel')}
              >
                <BattleAction
                  label={t('battle.reroll')}
                  reason={blocked || shortage(3)}
                  onClick={() => play('reroll')}
                />
                <BattleAction
                  label={t('battle.convert')}
                  reason={
                    blocked ||
                    shortage(3) ||
                    (battle.held.length === 2
                      ? t('combatUi.holdLimit')
                      : null) ||
                    (convertTarget(battle) < 0
                      ? t('combatUi.transformBlocked')
                      : null)
                  }
                  onClick={() => play('convert')}
                />
              </div>
            </div>
          )}
          {!finished && !victory && !scene && (
            <div className={style.details}>
              <BattlePopover
                className={style.help}
                toggleClassName={style.helpToggle}
                panel={
                  <div className={style.report}>
                    {!battle.log && <p className={style.log}>{t('combatUi.noReport')}</p>}
                    {(battle.log ||
                      activeFeedback?.phaseChanged ||
                      (!withholding && changes.length > 0)) && (
                      <div className={style.log}>
                        {activeFeedback?.critical && (
                          <strong className={style.notice}>
                            {t('combatFeedback.critical')} ·{' '}
                          </strong>
                        )}
                        {!withholding && activeFeedback?.phaseChanged && (
                          <strong className={style.notice}>
                            {t('combatFeedback.phase')} ·{' '}
                          </strong>
                        )}
                        {battle.log && t('battle.log', battle.log)}
                        {!withholding && changes.length > 0 && (
                          <ul className={style.matches}>
                            {changes.map(({ id, duration }) => (
                              <li key={id}>
                                {duration > 0
                                  ? t('combatFeedback.statusApplied', {
                                      status: t(`statuses.${id}`),
                                      duration,
                                    })
                                  : t('combatFeedback.statusEnded', {
                                      status: t(`statuses.${id}`),
                                    })}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {!withholding && battle.matches.length > 0 && (
                      <ul className={style.matches}>
                        {battle.matches.map(({ line, symbol, count }) => {
                          const effect = hero.slotConfig.pool.find(
                            ({ id }) => id === symbol
                          )?.effect
                          if (!effect) return null
                          return (
                            <li
                              className={style.match}
                              key={line}
                              data-effect={effect}
                            >
                              {t('combatUi.line', {
                                line: line + 1,
                                symbol: t(`symbols.${symbol}`),
                                count,
                                effect: t(
                                  `combatUi.${effect === 'focus' ? 'focusEffect' : effect}`
                                ),
                              })}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                }
              >
                <HelpCircle className={style.icon} size={15} aria-hidden />
                {t('combatUi.help')}
              </BattlePopover>
              {progress.equipped.length > 0 && (
                <p className={style.equipped}>
                  {t('game.equipped')}:{' '}
                  {progress.equipped
                    .map((id) => t(`items.${id}.name`))
                    .join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </VisualScene>
  )
}

export default Battle
