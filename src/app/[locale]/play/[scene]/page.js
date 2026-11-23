import { notFound } from 'next/navigation'

import PlayScene from '@/modules/Play'
import { scenes } from '@/modules/Play/routes'

export const generateStaticParams = () => scenes.map((scene) => ({ scene }))

export default async function ScenePage({ params }) {
  const { scene } = await params
  if (!scenes.includes(scene)) notFound()
  return <PlayScene scene={scene} />
}
