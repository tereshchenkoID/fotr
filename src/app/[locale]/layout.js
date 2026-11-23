import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { siteUrl } from '@/i18n/site'

import '@/app/[locale]/layout.scss'

import '@fontsource-variable/cinzel'
import '@fontsource-variable/dm-sans'

export const generateStaticParams = () =>
  routing.locales.map((locale) => ({ locale }))

export const generateMetadata = async ({ params }) => {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    metadataBase: new URL(siteUrl),
    title: 'Fate of the Ring',
    description: t('intro'),
    alternates: {
      canonical: `/${locale}/`,
      languages: Object.fromEntries(
        [...routing.locales, 'x-default'].map((id) => [
          id,
          `/${id === 'x-default' ? 'en' : id}/`,
        ])
      ),
    },
    openGraph: {
      type: 'website',
      title: 'Fate of the Ring',
      description: t('intro'),
      url: `/${locale}/`,
      locale: { en: 'en_US', ru: 'ru_RU', uk: 'uk_UA' }[locale],
      images: [
        {
          url: '/art/key.webp',
          width: 1536,
          height: 1024,
          alt: 'Fate of the Ring',
        },
      ],
    },
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
