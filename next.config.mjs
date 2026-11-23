import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.js')

const nextConfig = {
  agentRules: false,
  devIndicators: false,
  trailingSlash: true,
  sassOptions: {
    additionalData: '@use "@/scss/config" as *;',
  },
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
