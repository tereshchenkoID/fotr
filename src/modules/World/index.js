import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Backpack,
  BookOpen,
  Castle,
  Check,
  Compass,
  Flag,
  House,
  Lock,
  Minus,
  Mountain,
  Plus,
  Swords,
  Tent,
  Trees,
} from 'lucide-react'

import { useRouter } from '@/i18n/navigation'

import { useGame } from '@/store/game'
import { chapterKey, stories } from '@/game/content/stories'
import { resolveLocationVisuals } from '@/game/content/visual-themes'
import {
  campaigns, locationMarkers, locations, mapLabelPositions
} from '@/game/content/world'
import { sceneFor } from '@/game/core/session'
import { canTravel } from '@/game/core/story'
import { campGames } from '@/game/core/trials'

import Action from '@/components/Action'

import style from './index.module.scss'

const keyboardPan = {
  ArrowLeft: [-96, 0], ArrowRight: [96, 0], ArrowUp: [0, -96], ArrowDown: [0, 96],
}
const markerIcons = { settlement: House, fortress: Castle, forest: Trees, cave: Mountain, landmark: Compass }
const routePoints = (ids) => ids.map((id) => `${locations[id].x},${locations[id].y}`).join(' ')

const currentScene = (location, progress, node) =>
  location.id === progress.location ? node : undefined

const World = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const busy = useGame((state) => state.busy)
  const [selected, setSelected] = useState(null)
  const [zoom, setZoom] = useState(0)
  const viewport = useRef(null)
  const map = useRef(null)
  const drag = useRef(null)
  const dragged = useRef(false)
  const campaign = campaigns[hero.campaignId]
  const nextLocation = hero.route[progress.chapter + 1]
  const openLocation = canTravel(hero, progress, nextLocation) ? nextLocation : null
  const target = locations[selected || openLocation || progress.location]
  const targetChapter = hero.route.indexOf(target.id)
  const arrival = stories[hero.id][`${chapterKey(hero, targetChapter)}.dialogue`]
  const preview = resolveLocationVisuals(hero.campaignId, target.id, currentScene(target, progress, node))
  const description = t(arrival?.title ? `chronicle.landmarks.${arrival.title}` : `landmarks.${target.id}`)
  const canEnter = canTravel(hero, progress, target.id)
  const current = target.id === progress.location
  const bossAt = (id) => stories[hero.id][`${chapterKey(hero, hero.route.indexOf(id))}.choice`]?.boss
  const boss = bossAt(target.id)
  const showObjective = (current || canEnter) && node.type !== 'end'
  const pending = current && node.type === 'reward'
  const sideAt = (id) => id === progress.location && (
    progress.side?.active || (node.type === 'camp' && !progress.side && campGames(node).length > 0)
  )
  const camp = sideAt(target.id)

  useEffect(() => {
    const frame = viewport.current
    const canvas = map.current
    frame.scrollTo(
      (canvas.clientWidth * target.x) / 100 - frame.clientWidth / 2,
      (canvas.clientHeight * target.y) / 100 - frame.clientHeight / 2
    )
  }, [target.x, target.y, zoom])

  const status = (id) => {
    if (id === progress.location) return 'here'
    if (canTravel(hero, progress, id)) return 'open'
    if (progress.completed.includes(id)) return 'visited'
    return 'locked'
  }

  const begin = (event) => {
    dragged.current = false
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      left: event.currentTarget.scrollLeft,
      top: event.currentTarget.scrollTop,
    }
  }
  const pan = (event) => {
    if (!drag.current) return
    const { x, y, left, top } = drag.current
    if (
      !dragged.current &&
      Math.hypot(event.clientX - x, event.clientY - y) < 6
    )
      return
    dragged.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.scrollTo(
      left + x - event.clientX,
      top + y - event.clientY
    )
  }
  const panWithKeys = (event) => {
    const delta = keyboardPan[event.key]
    if (!delta || event.target !== event.currentTarget) return
    event.preventDefault()
    event.currentTarget.scrollBy(...delta)
  }
  const end = () => {
    drag.current = null
  }
  const travel = async () => {
    if (await command({ type: 'travel', location: target.id })) {
      setSelected(null)
      router.push('/play/story')
    }
  }

  return (
    <>
      <header className={style.heading}>
        <div>
          <p className={style.caption}>{t(`campaigns.${hero.campaignId}.name`)}</p>
          <h1 className={style.title}>{t('nav.world')}</h1>
        </div>
        <p className={style.caption}>
          {t('world.progress', {
            done: progress.completed.length,
            total: hero.route.length,
            hero: t(hero.nameKey),
          })}
        </p>
      </header>
      <div className={style.layout}>
        <section className={style.mapFrame} aria-label={t('nav.world')}>
          <div className={style.controls}>
            <button
              className={style.zoom}
              type="button"
              onClick={() => setZoom((level) => Math.max(0, level - 1))}
              disabled={zoom === 0}
              aria-label={t('world.zoomOut')}
            >
              <Minus size={18} />
            </button>
            <button
              className={style.zoom}
              type="button"
              onClick={() => setZoom((level) => Math.min(2, level + 1))}
              disabled={zoom === 2}
              aria-label={t('world.zoomIn')}
            >
              <Plus size={18} />
            </button>
          </div>
          <div
            ref={viewport}
            className={style.viewport}
            tabIndex={0}
            aria-label={t('world.pan')}
            onKeyDown={panWithKeys}
            onPointerDown={begin}
            onPointerMove={pan}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
          >
            <div
              ref={map}
              className={style.map}
              data-zoom={zoom}
              data-era={hero.campaignId}
            >
              <svg
                className={style.routes}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline className={style.path} points={routePoints(hero.route)} />
                <polyline className={style.visitedPath} points={routePoints(hero.route.slice(0, progress.chapter + 1))} />
                {openLocation && <polyline className={style.openPath} points={routePoints([progress.location, openLocation])} />}
              </svg>
              {campaign.locationIds.map((id, index) => {
                const state = status(id)
                const special = sideAt(id) ? 'side' : bossAt(id) ? 'boss' : undefined
                const Icon = special === 'side' ? Tent : special === 'boss' ? Swords : markerIcons[locationMarkers[id]]
                const Status = state === 'locked' ? Lock : state === 'visited' ? Check : null
                const position = mapLabelPositions[id] || (index % 2 === 1 ? 'below' : 'above')
                const label = state !== 'locked' || target.id === id || mapLabelPositions[id] || locationMarkers[id] === 'settlement'
                const marker = [
                  locations[id].names[locale], t(`world.${state}`),
                  special === 'side' ? t('story.side') : special === 'boss' ? t('battle.boss') : null,
                ].filter(Boolean).join(' · ')
                return (
                  <button
                    className={style.pin}
                    type="button"
                    key={id}
                    style={{ left: `${locations[id].x}%`, top: `${locations[id].y}%` }}
                    data-state={state}
                    data-special={special}
                    data-label-position={position}
                    aria-pressed={target.id === id}
                    aria-label={marker}
                    onClick={(event) => {
                      if (!dragged.current || event.detail === 0) setSelected(id)
                    }}
                  >
                    <Icon size={state === 'locked' ? 12 : 17} aria-hidden />
                    {Status && <Status className={style.markerBadge} size={11} aria-hidden />}
                    {label && <span className={style.markerLabel} aria-hidden>{locations[id].names[locale]}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
        <aside className={style.details}>
          {preview.image && (
            <div className={style.preview}>
              <Image className={style.previewImage} src={preview.image} fill sizes="(max-width: 768px) 100vw, 400px" alt="" />
            </div>
          )}
          <p className={style.state} aria-live="polite">
            {status(target.id) === 'locked' && <Lock size={15} aria-hidden />}
            {t(`world.${status(target.id)}`)}
          </p>
          <h2>{target.names[locale]}</h2>
          {showObjective && (
            <ul className={style.objectives}>
              <li className={style.objective}>
                <BookOpen size={16} aria-hidden />
                {current && node.title ? t(`chronicle.titles.${node.title}.dialogue`) : t('story.chapter', { chapter: hero.route.indexOf(target.id) + 1 })}
              </li>
              {boss && (
                <li className={style.objective}>
                  <Swords size={16} aria-hidden />
                  {t('battle.boss')}
                </li>
              )}
              {pending && (
                <li className={style.objective}>
                  <Backpack size={16} aria-hidden />
                  {t('story.reward')}
                </li>
              )}
              {camp && (
                <li className={style.objective}>
                  <Flag size={16} aria-hidden />
                  {t('story.side')}
                </li>
              )}
            </ul>
          )}
          <p className={style.description}>{description}</p>
          {current && node.type !== 'travel' && (
            <Action href={`/play/${sceneFor(node)}`}>{t('world.enter')}</Action>
          )}
          {canEnter && (
            <Action onClick={travel} disabled={busy}>
              {t('world.travel')}
            </Action>
          )}
          <label className={style.locationSelect}>
            {t('world.locations')}
            <select className={style.select}
              value={target.id}
              onChange={(event) => setSelected(event.target.value)}
            >
              {campaign.locationIds.map((id) => (
                <option key={id} value={id}>
                  {locations[id].names[locale]} · {t(`world.${status(id)}`)}
                </option>
              ))}
            </select>
          </label>
          {node.type === 'travel' && !canEnter && (
            <button
              type="button"
              className={style.next}
              onClick={() => setSelected(hero.route[progress.chapter + 1])}
            >
              <Flag size={16} aria-hidden />
              {t('world.showNext')}
            </button>
          )}
        </aside>
      </div>
    </>
  )
}

export default World
