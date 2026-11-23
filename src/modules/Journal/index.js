import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  Coins, Crown, Flame, Gem, Sparkles, Trophy 
} from 'lucide-react'

import { useGame } from '@/store/game'
import { achievements, items } from '@/game/content/items'
import { heroStats } from '@/game/core/battle'

import Action from '@/components/Action'
import Meter from '@/components/Meter'

import style from './index.module.scss'

const icons = { Gem, Flame, Sparkles, Crown }

const Inventory = ({ hero, progress, command, save }) => {
  const t = useTranslations()
  const busy = useGame((state) => state.busy)
  const stats = heroStats(hero, progress)
  return (
    <>
      <p className={style.overview}>
        {t('inventory.slots', { value: progress.equipped.length })} ·{' '}
        {t('inventory.collection', {
          value: save.collection.length,
          total: Object.keys(items).length,
        })}
      </p>
      <div className={style.grid}>
        {progress.inventory.map((id) => {
          const item = items[id]
          const Icon = icons[item.glyph]
          const equipped = progress.equipped.includes(id)
          return (
            <section key={id} className={style.panel}>
              <Icon className={style.icon} size={25} aria-hidden />
              <p className={style.description}>{t(`inventory.${item.rarity}`)}</p>
              <h2>{t(`items.${id}.name`)}</h2>
              <p className={style.description}>{t(`items.${id}.description`)}</p>
              <ul className={style.bonuses}>
                {Object.entries(item.effects).map(([key, value]) => (
                  <li key={key}>
                    {t(`game.${key}`)} · {stats[key]} →{' '}
                    {stats[key] + value * (equipped ? -1 : 1)}
                  </li>
                ))}
              </ul>
              <Action
                variant={equipped ? 'secondary' : 'primary'}
                disabled={
                  busy ||
                  !!progress.event ||
                  progress.side?.active ||
                  (!equipped && progress.equipped.length >= 2)
                }
                onClick={() => command({ type: 'equip', id })}
              >
                {t(`inventory.${equipped ? 'remove' : 'equip'}`)}
              </Action>
            </section>
          )
        })}
      </div>
    </>
  )
}

const Profile = ({ hero, progress, save }) => {
  const t = useTranslations()
  const stats = heroStats(hero, progress)
  const levelXp = hero.progression.xpStep
  return (
    <div className={style.profile}>
      <Image className={style.portrait} src={hero.portrait} alt="" width={512} height={543} />
      <section className={style.panel}>
        <h2>{t(hero.nameKey)}</h2>
        <p className={style.description}>{t(hero.descriptionKey)}</p>
        <p className={style.description}>{t('game.resumeLevel', { level: progress.level })}</p>
        <Meter className={style.meter}
          label={t('game.hp')}
          value={progress.hp}
          max={stats.hp}
          kind="health"
        />
        <Meter className={style.meter}
          label={t('game.xp')}
          value={progress.xp % levelXp}
          max={levelXp}
        />
        <div className={style.actions}>
          {['attack', 'defense', 'magic'].map((id) => (
            <span className={style.stat} key={id}>
              {t(`game.${id}`)} {stats[id]}
            </span>
          ))}
          <span className={style.stat}>
            <Coins size={17} aria-hidden />
            {t('story.coins', { value: save.coins })}
          </span>
        </div>
        <p className={style.description}>
          {t('inventory.ability', { name: t(`heroes.${hero.id}.ability`) })}
        </p>
        <p className={style.description}>
          {t('inventory.combo', {
            symbol: t(`symbols.${hero.jackpot.symbol}`),
          })}
        </p>
        {hero.id === 'sauron' && (
          <p className={style.description}>
            {t('inventory.influence', {
              influence: progress.flags.influence || 0,
              corruption: progress.flags.corruption || 0,
            })}
          </p>
        )}
      </section>
    </div>
  )
}

const Achievements = ({ save }) => {
  const t = useTranslations()
  return (
    <div className={style.grid}>
      {achievements.map((id) => (
        <section
          key={id}
          className={style.panel}
          data-locked={!save.achievements.includes(id)}
        >
          <Trophy className={style.icon} size={24} aria-hidden />
          <h2>{t(`achievements.${id}`)}</h2>
          <p className={style.description}>
            {t(
              `inventory.${save.achievements.includes(id) ? 'unlocked' : 'locked'}`
            )}
          </p>
        </section>
      ))}
    </div>
  )
}

const Journal = ({ scene, ...props }) => {
  const t = useTranslations('nav')
  const Content = {
    inventory: Inventory,
    profile: Profile,
    achievements: Achievements,
  }[scene]
  return (
    <article className={style.block}>
      <h1 className={style.title}>{t(scene)}</h1>
      <Content {...props} />
    </article>
  )
}

export default Journal
