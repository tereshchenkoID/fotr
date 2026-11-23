import { setRequestLocale } from 'next-intl/server'

import Home from '@/sections/Home'

export default async function LandingPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <Home />
}
