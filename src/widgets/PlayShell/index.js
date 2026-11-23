'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Backpack,
  BookOpen,
  Compass,
  LibraryBig,
  Settings2,
  Trophy,
  UserRound,
} from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'

import { useGame } from '@/store/game'

import Header from '@/widgets/Header'

import style from './index.module.scss'

const links = [
  ['world', Compass],
  ['story', BookOpen],
  ['inventory', Backpack],
  ['profile', UserRound],
  ['achievements', Trophy],
  ['campaign', LibraryBig],
  ['settings', Settings2],
]

const PlayShell = ({ children }) => {
  const t = useTranslations()
  const hydrate = useGame((state) => state.hydrate)
  const activeHero = useGame((state) => state.save?.activeHero)
  const error = useGame((state) => state.error)
  const pathname = usePathname()
  useEffect(() => {
    void hydrate()
  }, [hydrate])
  return (
    <>
      <Header game />
      <div className={style.block}>
        <nav className={style.nav} aria-label={t('nav.game')}>
          {links
            .filter(
              ([id]) => activeHero || ['campaign', 'settings'].includes(id)
            )
            .map(([id, Icon]) => {
              const href = `/play/${id}`
              return (
                <Link
                  key={id}
                  className={style.navLink}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  <Icon size={16} aria-hidden />
                  {t(`nav.${id}`)}
                </Link>
              )
            })}
        </nav>
        <main id="game">
          {error && (
            <p className={style.error} role="alert">
              {t(`game.${error}`)}{' '}
              <Link className={style.recoveryLink} href="/play/settings">{t('nav.settings')}</Link>
            </p>
          )}
          {children}
        </main>
      </div>
    </>
  )
}

export default PlayShell
