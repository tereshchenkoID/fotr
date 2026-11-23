import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Dices,
  Layers,
  Orbit,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react'

import { Link } from '@/i18n/navigation'

import { art } from '@/game/content/assets'
import { heroes } from '@/game/content/heroes'
import { campaigns } from '@/game/content/world'

import Action from '@/components/Action'
import Header from '@/widgets/Header'

import style from './index.module.scss'

const featured = ['frodo', 'legolas', 'sauron']
const mechanics = [
  { id: 'battle', Icon: Swords },
  { id: 'blackjack', Icon: Layers },
  { id: 'dice', Icon: Dices },
]

const Home = () => {
  const t = useTranslations()
  return (
    <>
      <Header />
      <main>
        <section className={style.hero}>
          <div className={style.heroContent}>
            <p className={style.eyebrow}>
              <span className={style.rule} />
              {t('home.kicker')}
            </p>
            <h1 className={style.heroTitle}>
              Fate of <span className={style.heroAccent}>the Ring</span>
            </h1>
            <p className={style.heroText}>{t('home.intro')}</p>
            <div className={style.heroActions}>
              <Action className={style.heroPlay} href="/play/campaign">
                <Swords size={19} aria-hidden />
                {t('home.begin')}
              </Action>
              <a href="#campaigns" className={style.explore}>
                {t('home.explore')} <ChevronDown className={style.exploreIcon} size={17} aria-hidden />
              </a>
            </div>
          </div>
          <div className={style.heroFooter}>
            <span className={style.feature}>
              <Compass className={style.featureIcon} size={15} aria-hidden />
              {t('home.ages')}
            </span>
            <span className={style.feature}>
              <Shield className={style.featureIcon} size={15} aria-hidden />
              {t('home.roster')}
            </span>
            <span className={style.feature}>
              <BookOpen className={style.featureIcon} size={15} aria-hidden />
              {t('home.saves')}
            </span>
          </div>
        </section>
        <section id="campaigns" className={style.section}>
          <div className={style.sectionHead}>
            <p className={style.eyebrow}>
              <Orbit size={16} aria-hidden />
              {t('home.chronicles')}
            </p>
            <h2 className={style.sectionTitle}>{t('home.campaignTitle')}</h2>
            <p className={style.description}>{t('home.campaignDescription')}</p>
          </div>
          <div className={style.cards}>
            {Object.values(campaigns).map((campaign) => (
              <Link
                key={campaign.id}
                href={`/play/hero?campaign=${campaign.id}`}
                className={style.campaign}
              >
                <Image className={style.cardImage}
                  src={campaign.image}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 92vw, 30vw"
                />
                <div className={style.cardCopy}>
                  <p className={style.eyebrow}>
                    {t(`campaigns.${campaign.id}.era`)}
                  </p>
                  <h3 className={style.cardTitle}>{t(`campaigns.${campaign.id}.name`)}</h3>
                  <p className={style.cardDescription}>{t(`campaigns.${campaign.id}.description`)}</p>
                  <span className={style.cardLink}>
                    {t('home.viewCampaign')}{' '}
                    <ChevronRight size={16} aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section id="heroes" className={`${style.section} ${style.roster}`}>
          <div className={style.sectionHead}>
            <p className={style.eyebrow}>
              <Shield size={16} aria-hidden />
              {t('nav.heroes')}
            </p>
            <h2 className={style.sectionTitle}>{t('home.heroTitle')}</h2>
            <p className={style.description}>{t('home.heroDescription')}</p>
          </div>
          <div className={style.cards}>
            {featured.map((id) => (
              <article key={id} className={style.portrait}>
                <Image className={style.cardImage}
                  src={heroes[id].portrait}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 92vw, 30vw"
                />
                <div className={style.cardCopy}>
                  <h3 className={style.cardTitle}>{t(heroes[id].nameKey)}</h3>
                  <p className={style.cardDescription}>{t(heroes[id].descriptionKey)}</p>
                </div>
              </article>
            ))}
          </div>
          <Action className={style.rosterAction} href="/play/campaign" variant="secondary">
            {t('home.viewHeroes')}
          </Action>
        </section>
        <section id="mechanics" className={style.section}>
          <div className={style.sectionHead}>
            <p className={style.eyebrow}>
              <Dices size={16} aria-hidden />
              {t('nav.mechanics')}
            </p>
            <h2 className={style.sectionTitle}>{t('home.mechanicsTitle')}</h2>
            <p className={style.description}>{t('home.mechanicsDescription')}</p>
          </div>
          <div className={style.cards}>
            {mechanics.map(({ id, Icon }) => (
              <article key={id} className={style.infoCard}>
                <Icon className={style.infoIcon} size={27} strokeWidth={1.35} aria-hidden />
                <h3 className={style.infoTitle}>{t(`nav.${id}`)}</h3>
                <p className={style.infoText}>{t(`rules.${id}`)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={`${style.section} ${style.split}`}>
          <div className={style.mapArt}>
            <Image className={style.artImage}
              src={art.map}
              alt=""
              fill
              sizes="(max-width: 720px) 92vw, 50vw"
            />
          </div>
          <div className={style.sectionHead}>
            <p className={style.eyebrow}>
              <Compass size={16} aria-hidden />
              {t('nav.world')}
            </p>
            <h2 className={style.sectionTitle}>{t('home.mapTitle')}</h2>
            <p className={style.description}>{t('home.mapDescription')}</p>
          </div>
        </section>
        <section
          className={`${style.section} ${style.split} ${style.cinematic}`}
        >
          <div className={style.sectionHead}>
            <p className={style.eyebrow}>
              <Sparkles size={16} aria-hidden />
              {t('home.jackpot')}
            </p>
            <h2 className={style.sectionTitle}>{t('home.jackpotTitle')}</h2>
            <p className={style.description}>{t('home.jackpotDescription')}</p>
          </div>
          <div className={style.mapArt}>
            <Image className={style.artImage}
              src={heroes.sauron.portrait}
              alt=""
              fill
              sizes="(max-width: 720px) 92vw, 50vw"
            />
          </div>
        </section>
        <section className={style.section}>
          <div className={style.cards}>
            {['artifacts', 'progress', 'local'].map((id) => (
              <article key={id} className={style.infoCard}>
                <h3 className={style.infoTitle}>{t(`home.${id}.title`)}</h3>
                <p className={style.infoText}>{t(`home.${id}.body`)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={`${style.section} ${style.faq}`}>
          <div className={style.sectionHead}>
            <h2 className={style.sectionTitle}>{t('home.faqTitle')}</h2>
          </div>
          {['cost', 'offline', 'switch'].map((id) => (
            <details className={style.faqItem} key={id}>
              <summary className={style.faqQuestion}>
                {t(`home.faq.${id}.question`)}
                <ChevronDown className={style.faqIcon} size={18} aria-hidden />
              </summary>
              <p className={style.faqAnswer}>{t(`home.faq.${id}.answer`)}</p>
            </details>
          ))}
        </section>
      </main>
      <footer className={style.footer}>
        <Link className={style.footerBrand} href="/">
          <Orbit size={22} aria-hidden /> Fate of the Ring
        </Link>
        <p className={style.footerText}>{t('home.footer')}</p>
        <Action href="/play/campaign">{t('home.begin')}</Action>
      </footer>
    </>
  )
}

export default Home
