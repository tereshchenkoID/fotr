'use client'

import { Suspense, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

import { useGame } from '@/store/game'
import { heroes } from '@/game/content/heroes'
import { sceneFor } from '@/game/core/session'
import { getNode } from '@/game/core/story'
import { gameTypes, sideTypes } from '@/game/core/trials'

import Action from '@/components/Action'
import Settings from '@/modules/Journal/Settings'
import CampaignSelection from '@/modules/Selection/CampaignSelection'
import HeroSelection from '@/modules/Selection/HeroSelection'

import style from './index.module.scss'

const World = dynamic(
  () => import('@/modules/World'),
  { loading: () => <Loading /> }
)
const Story = dynamic(
  () => import('@/modules/Story'),
  { loading: () => <Loading /> }
)
const Battle = dynamic(
  () => import('@/modules/Battle'),
  { loading: () => <Loading /> }
)
const Trials = dynamic(
  () => import('@/modules/Trials'),
  { loading: () => <Loading /> }
)
const Journal = dynamic(
  () => import('@/modules/Journal'),
  { loading: () => <Loading /> }
)

const Loading = () => {
  const t = useTranslations('game')
  return (
    <p className={style.notice} role="status">
      {t('loading')}
    </p>
  )
}

const HeroRoute = ({ save, select }) => {
  const query = useSearchParams()
  return (
    <HeroSelection
      campaignId={query.get('campaign')}
      save={save}
      select={select}
    />
  )
}

const ContextScene = ({ scene, save, send }) => {
  const router = useRouter()
  const hero = heroes[save.activeHero]
  const progress = hero && save.heroes[hero.id]
  const node = hero && getNode(hero, progress)
  const expected = node && sceneFor(node)
  let redirect = null
  if (!hero) redirect = '/play/campaign'
  else if (scene === 'story' && expected !== 'story')
    redirect = `/play/${expected}`
  else if (
    gameTypes.includes(scene) &&
    scene !== expected
  )
    redirect = `/play/${expected}`
  useEffect(() => {
    if (redirect) router.replace(redirect)
  }, [redirect, router])

  if (redirect) return <Loading />
  const command = (data) => send({ hero: hero.id, node: node.id, ...data })
  const props = { hero, progress, node, save, command }
  if (scene === 'world') return <World key={hero.id} {...props} />
  if (scene === 'story') return <Story {...props} />
  if (scene === 'battle')
    return <Battle key={`${hero.id}:${node.id}`} {...props} />
  if (sideTypes.includes(scene))
    return <Trials key={`${hero.id}:${node.id}`} {...props} />
  return <Journal {...props} scene={scene} />
}

const PlayScene = ({ scene }) => {
  const t = useTranslations('game')
  const save = useGame((state) => state.save)
  const send = useGame((state) => state.dispatch)
  const error = useGame((state) => state.error)
  const router = useRouter()
  const select = async (id) => {
    if (await send({ type: 'select', id })) router.push('/play/world')
  }
  if (scene === 'settings') return <Settings />
  if (!save)
    return error ? (
      <Action href="/play/settings">{t('recover')}</Action>
    ) : (
      <Loading />
    )
  if (scene === 'campaign') return <CampaignSelection save={save} />
  if (scene === 'hero') {
    return (
      <Suspense fallback={<Loading />}>
        <HeroRoute save={save} select={select} />
      </Suspense>
    )
  }
  return <ContextScene scene={scene} save={save} send={send} />
}

export default PlayScene
