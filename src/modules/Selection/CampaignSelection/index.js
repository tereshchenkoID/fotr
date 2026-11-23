import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { BookOpen, ChevronRight } from 'lucide-react'

import { heroes } from '@/game/content/heroes'
import { campaigns } from '@/game/content/world'

import Action from '@/components/Action'

import Intro from '../Intro'

import style from './index.module.scss'

const CampaignSelection = ({ save }) => {
  const t = useTranslations()
  const active = heroes[save.activeHero]
  return (
    <>
      <Intro
        title={t('game.chooseCampaign')}
        text={t('game.chooseCampaignHelp')}
      >
        {active && (
          <Action href="/play/world">
            <BookOpen size={17} aria-hidden />
            {t('game.continueAs', { hero: t(active.nameKey) })}
          </Action>
        )}
      </Intro>
      <div className={style.block}>
        {Object.values(campaigns).map((campaign) => (
          <article key={campaign.id} className={style.campaign}>
            <Image className={style.campaignImage}
              src={campaign.image}
              alt=""
              fill
              sizes="(max-width: 768px) 90vw, 31vw"
            />
            <div className={style.copy}>
              <p className={style.era}>{t(`campaigns.${campaign.id}.era`)}</p>
              <h2 className={style.campaignTitle}>{t(`campaigns.${campaign.id}.name`)}</h2>
              <p className={style.campaignText}>{t(`campaigns.${campaign.id}.description`)}</p>
              <Action className={style.campaignAction}
                href={`/play/hero?campaign=${campaign.id}`}
                variant="secondary"
              >
                {t('game.selectCampaign')}
                <ChevronRight size={17} aria-hidden />
              </Action>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default CampaignSelection
