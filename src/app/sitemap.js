import { routing } from '@/i18n/routing'
import { siteUrl } from '@/i18n/site'

export const dynamic = 'force-static'

export default function sitemap() {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${siteUrl}/${locale}/`])
  )
  return Object.values(languages).map((url) => ({
    url,
    alternates: { languages: { ...languages, 'x-default': languages.en } },
  }))
}
