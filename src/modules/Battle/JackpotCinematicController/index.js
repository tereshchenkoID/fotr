import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'

import Action from '@/components/Action'

import style from './index.module.scss'

const JackpotCinematicController = ({ hero, onDismiss }) => {
  const t = useTranslations()
  const dialog = useRef(null)
  const dismiss = useRef(onDismiss)

  useEffect(() => {
    dismiss.current = onDismiss
  }, [onDismiss])
  useEffect(() => {
    const element = dialog.current
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const reveal = reduced ? 0 : 520
    const entrance = window.setTimeout(() => element.showModal(), reveal)
    const timer = window.setTimeout(
      () => dismiss.current(),
      reveal + (reduced ? 2600 : 4400)
    )
    return () => {
      window.clearTimeout(entrance)
      window.clearTimeout(timer)
      element.close()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className={style.block}
      aria-labelledby="jackpot-title"
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
    >
      <div className={style.cinematicArt}>
        <Image className={style.image}
          src={hero.portrait}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 650px"
        />
      </div>
      <div className={style.cinematicCopy}>
        <Sparkles size={31} aria-hidden />
        <p className={style.text}>{t('home.jackpot')}</p>
        <h2 className={style.title} id="jackpot-title">{t(`heroes.${hero.id}.jackpot`)}</h2>
        <p className={style.text}>{t(`heroes.${hero.id}.cinematic`)}</p>
        <Action onClick={onDismiss}>{t('battle.skip')}</Action>
      </div>
    </dialog>
  )
}

export default JackpotCinematicController
