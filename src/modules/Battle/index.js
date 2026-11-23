import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Shield, Sword, Zap } from 'lucide-react'

import { useTurnAnimation } from '@/hooks/useTurnAnimation'
import { useGame } from '@/store/game'
import { art, enemyArt } from '@/game/content/assets'
import { enemies } from '@/game/content/items'

import Action from '@/components/Action'
import Meter from '@/components/Meter'

import JackpotCinematicController from './JackpotCinematicController'
import Reels, { getReelSpinDuration } from './Reels'

import style from './index.module.scss'

const Combatant = ({ name, portrait, hp, max, title }) => (
  <div className={style.combatant}>
    <div className={style.portrait}>
      <Image className={style.portraitImage}
        src={portrait}
        alt=""
        fill
        sizes="(max-width: 768px) 40vw, 230px"
      />
    </div>
    <h2 className={style.combatantName}>{name}</h2>
    <Meter label={title} value={hp} max={max} kind="health" />
  </div>
)

const Battle = ({ hero, progress, node, save, command }) => {
  const t = useTranslations()
  const committed = progress.event
  const before = useTurnAnimation(
    committed,
    committed.turn,
    getReelSpinDuration
  )
  const battle = before || committed
  const busy = useGame((state) => state.busy)
  const [autoPaused, setAutoPaused] = useState(false)
  const ability = hero.abilities[0]
  const auto = save.settings.autoSpin && !autoPaused
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
    <article className={style.block} data-theme={hero.theme}>
      <header className={style.heading}>
        <p className={style.caption}>{node.boss ? t('battle.boss') : t('story.choice')}</p>
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
          />
        </div>
        <div className={style.enemy}>
          <Combatant
            name={t(`enemies.${battle.enemyId}`)}
            portrait={enemyArt[battle.enemyId] || art.enemy}
            hp={battle.enemyHp}
            max={enemies[battle.enemyId].hp}
            title={t('game.hp')}
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
            result={committed}
            before={before}
            play={play}
            locked={locked}
          />
          <div className={style.log} aria-live="polite">
            {battle.log ? t('battle.log', battle.log) : t('rules.battle')}
          </div>
          <div className={style.status}>
            {battle.shield > 0 && (
              <span className={style.statusItem}>
                <Shield size={15} aria-hidden />
                {t('battle.shield', { value: battle.shield })}
              </span>
            )}
            {Object.entries(battle.statuses)
              .filter(([, value]) => value > 0)
              .map(([id, value]) => (
                <span key={id} className={style.statusItem}>
                  {t(`statuses.${id}`)} · {value}
                </span>
              ))}
          </div>
          <div className={style.actions}>
            <Action disabled={locked} onClick={() => play('spin')}>
              <Sword size={16} aria-hidden />
              {t('battle.attack')}
            </Action>
            {save.settings.autoSpin && (
              <Action
                variant="secondary"
                onClick={() => setAutoPaused(!autoPaused)}
                disabled={!!battle.result}
              >
                {t(`battle.${autoPaused ? 'resume' : 'pause'}`)}
              </Action>
            )}
            <Action
              variant="secondary"
              disabled={
                locked || battle.focus < ability.cost || !!battle.cooldown
              }
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
              disabled={locked || battle.focus < 3 || battle.held.length === 2}
              onClick={() => play('convert')}
            >
              {t('battle.convert')}
            </Action>
          </div>
          {progress.equipped.length > 0 && (
            <p className={style.equipped}>
              {t('game.equipped')}:{' '}
              {progress.equipped.map((id) => t(`items.${id}.name`)).join(' · ')}
            </p>
          )}
          {battle.result && !battle.cinematic && (
            <div className={style.result}>
              <h2 className={style.resultTitle}>{t(`results.${battle.result}`)}</h2>
              <Action
                disabled={busy}
                onClick={() => command({ type: 'advance' })}
              >
                {t(
                  `battle.${battle.result === 'win' ? 'spoils' : 'checkpoint'}`
                )}
              </Action>
            </div>
          )}
        </div>
      </div>
      {battle.cinematic && (
        <JackpotCinematicController
          hero={hero}
          onDismiss={() => play('dismiss')}
        />
      )}
    </article>
  )
}

export default Battle
