'use client'

import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, Globe2, Orbit } from 'lucide-react'

import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

import Action from '@/components/Action'

import style from './index.module.scss'

const Header = ({ game = false }) => {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  return (
    <header className={style.block}>
      <div className={style.inner}>
        <Link href="/" className={style.brand}>
          <Orbit size={29} strokeWidth={1.4} aria-hidden />
          <span>
            FATE <i className={style.brandAccent}>OF THE</i> RING
          </span>
        </Link>
        {!game && (
          <nav className={style.nav} aria-label={t('sections')}>
            <a className={style.navLink} href="#campaigns">{t('campaigns')}</a>
            <a className={style.navLink} href="#heroes">{t('heroes')}</a>
            <a className={style.navLink} href="#mechanics">{t('mechanics')}</a>
          </nav>
        )}
        <div className={style.actions}>
          <label className={style.language}>
            <Globe2 size={16} aria-hidden />
            <select className={style.select}
              aria-label={t('language')}
              value={locale}
              onChange={(event) =>
                router.replace(
                  pathname + window.location.search + window.location.hash,
                  { locale: event.target.value }
                )
              }
            >
              {routing.locales.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className={style.caret} size={13} aria-hidden />
          </label>
          {!game && (
            <Action className={style.play} href="/play/campaign" variant="secondary">
              {t('play')}
            </Action>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
