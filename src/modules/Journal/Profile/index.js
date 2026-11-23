import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Heart, Shield, Sparkles, Sword, Zap
} from 'lucide-react'

import { items } from '@/game/content/items'
import { resolveVisuals, symbolFallback } from '@/game/content/visual-themes'
import { locations } from '@/game/content/world'
import { heroStats } from '@/game/core/battle'

import Meter from '@/components/Meter'
import VisualScene from '@/modules/VisualScene'

import ArtifactArt from '../ArtifactArt'

import style from './index.module.scss'

const attributes = {
  attack: Sword,
  defense: Shield,
  magic: Sparkles,
  hp: Heart,
}

const Effects = ({ effects }) => {
  const t = useTranslations('journal')
  return (
    <ul className={style.effects}>
      {Object.entries(effects)
        .filter(([, value]) => value > 0)
        .map(([id, value]) => (
          <li className={style.effect} key={id}>
            {t(id, { value })}
          </li>
        ))}
    </ul>
  )
}

const Profile = ({ hero, progress, node }) => {
  const t = useTranslations()
  const locale = useLocale()
  const visuals = resolveVisuals(hero, progress.location, node)
  const stats = heroStats(hero, progress)
  const natural = heroStats(hero, { ...progress, equipped: [] })
  const ability = hero.abilities[0]
  const { jackpot } = hero

  return (
    <VisualScene className={style.block} visuals={visuals}>
      <div className={style.portrait}>
        <Image
          className={style.heroImage}
          src={hero.portrait}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 420px"
        />
      </div>
      <div className={style.content}>
        <header className={style.identity}>
          <p className={style.caption}>
            {t(`campaigns.${hero.campaignId}.name`)} ·{' '}
            {t('game.resumeLevel', { level: progress.level })}
          </p>
          <h1>{t(hero.nameKey)}</h1>
          <p className={style.description}>{t(hero.descriptionKey)}</p>
        </header>
        <section className={style.panel}>
          <h2>{t('journal.attributes')}</h2>
          <dl className={style.attributes}>
            {Object.entries(attributes).map(([id, Icon]) => (
              <div className={style.attribute} key={id}>
                <dt className={style.attributeName}>
                  <Icon size={17} aria-hidden />
                  {t(`game.${id}`)}
                </dt>
                <dd className={style.value}>{stats[id]}</dd>
                <dd className={style.caption}>
                  {t('journal.baseBonus', {
                    base: natural[id],
                    bonus: stats[id] - natural[id],
                  })}
                </dd>
              </div>
            ))}
          </dl>
          <div className={style.meters}>
            <Meter
              label={t('game.hp')}
              value={progress.hp}
              max={stats.hp}
              kind="health"
            />
            <Meter
              label={t('game.xp')}
              value={progress.xp % hero.progression.xpStep}
              max={hero.progression.xpStep}
            />
          </div>
          {hero.id === 'sauron' && (
            <p className={style.caption}>
              {t('inventory.influence', {
                influence: progress.flags.influence || 0,
                corruption: progress.flags.corruption || 0,
              })}
            </p>
          )}
        </section>
        <div className={style.powers}>
          <section className={style.panel}>
            <p className={style.caption}>
              <Zap size={16} aria-hidden />
              {t('journal.ability')}
            </p>
            <h2>{t(`heroes.${hero.id}.ability`)}</h2>
            <p className={style.description}>
              {t('journal.availability', {
                cost: ability.cost,
                turns: ability.cooldown,
              })}
            </p>
            <Effects effects={ability.effect} />
          </section>
          <section className={style.panel}>
            <p className={style.caption}>{t('journal.jackpot')}</p>
            <h2>{t(`heroes.${hero.id}.jackpot`)}</h2>
            <Image
              className={style.relic}
              src={
                visuals.theme.symbols[jackpot.symbol]?.image || symbolFallback
              }
              alt=""
              width={64}
              height={64}
            />
            <p className={style.description}>
              {t('journal.jackpotRule', {
                count: jackpot.count,
                symbol: t(`symbols.${jackpot.symbol}`),
              })}
            </p>
            <Effects effects={jackpot.effect} />
          </section>
        </div>
        <section className={style.panel}>
          <h2>{t('journal.equipped')}</h2>
          {progress.equipped.length ? (
            <ul className={style.effects}>
              {progress.equipped.map((id) => (
                <li className={style.equipment} key={id}>
                  <ArtifactArt id={id} className={style.relic} />
                  <div>
                    <strong>{t(`items.${id}.name`)}</strong>
                    <p className={style.caption}>
                      {Object.entries(items[id].effects)
                        .map(
                          ([stat, value]) => `+${value} ${t(`game.${stat}`)}`
                        )
                        .join(' · ')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={style.description}>{t('journal.emptySlot')}</p>
          )}
        </section>
        <section className={style.panel}>
          <h2>{t('journal.story')}</h2>
          <p className={style.description}>
            {locations[progress.location].names[locale]} ·{' '}
            {t('journal.chapter', {
              chapter: progress.chapter + 1,
              total: hero.route.length,
            })}
          </p>
          <Meter
            label={t('journal.story')}
            value={progress.completed.length}
            max={hero.route.length}
          />
        </section>
      </div>
    </VisualScene>
  )
}

export default Profile
