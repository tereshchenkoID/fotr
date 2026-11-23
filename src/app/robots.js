import { siteUrl } from '@/i18n/site'

export const dynamic = 'force-static'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/en/play/', '/ru/play/', '/uk/play/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
