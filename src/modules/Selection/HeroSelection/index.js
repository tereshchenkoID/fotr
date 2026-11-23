import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Shield, Swords } from 'lucide-react'

import { useGame } from '@/store/game'
import { getHeroes } from '@/game/content/heroes'
import { campaigns } from '@/game/content/world'

import Action from '@/components/Action'

import Intro from '../Intro'

import style from './index.module.scss'

const HeroSelection = ({ campaignId, save, select }) => {
  const t = useTranslations()
  const busy = useGame((state) => state.busy)
  if (!Object.hasOwn(campaigns, campaignId)) {
    return (
      <Intro
        title={t('game.chooseCampaign')}
        text={t('game.chooseCampaignHelp')}
      >
        <Action href="/play/campaign">{t('nav.campaign')}</Action>
      </Intro>
    )
  }
  return (
    <>
      <Intro
        title={t('game.chooseHero')}
        text={t(`campaigns.${campaignId}.name`)}
      />
      <div className={style.block}>
        {getHeroes(campaignId).map((hero) => {
          const progress = save.heroes[hero.id]
          return (
            <article className={style.hero} key={hero.id}>
              <Image className={style.heroImage} src={hero.portrait} alt="" width={512} height={543} />
              <div className={style.heroCopy}>
                <h2>{t(hero.nameKey)}</h2>
                <p className={style.heroDescription}>{t(hero.descriptionKey)}</p>
                <div className={style.stats}>
                  <span className={style.stat}>
                    <Swords size={16} aria-hidden />
                    {t('game.attack')} {hero.stats.attack}
                  </span>
                  <span className={style.stat}>
                    <Shield size={16} aria-hidden />
                    {t('game.defense')} {hero.stats.defense}
                  </span>
                </div>
                <Action className={style.heroAction}
                  variant={progress ? 'primary' : 'secondary'}
                  onClick={() => select(hero.id)}
                  disabled={busy}
                  aria-label={t('game.selectNamedHero', {
                    hero: t(hero.nameKey),
                  })}
                >
                  {progress
                    ? t('game.resumeLevel', { level: progress.level })
                    : t('game.selectHero')}
                </Action>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

export default HeroSelection
