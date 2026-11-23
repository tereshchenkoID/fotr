import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'

import { symbolFallback } from '@/game/content/visual-themes'

import Action from '@/components/Action'

import CombatEffect from '../CombatEffect'

import style from './index.module.scss'

const JackpotCinematicController = ({ hero, visuals, damage, onDismiss }) => {
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
    const reveal = reduced ? 0 : 660
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
      data-effect={visuals.effects.jackpot}
      data-frame={visuals.frame}
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
        <Image className={style.relic} src={visuals.symbols[visuals.cinematicRelic]?.image || symbolFallback} alt="" width={128} height={128}
          onError={({ currentTarget }) => {
            if (!currentTarget.src.endsWith(symbolFallback)) currentTarget.src = symbolFallback
          }} />
        <CombatEffect large effect={visuals.effects.jackpot} />
      </div>
      <div className={style.cinematicCopy}>
        <Sparkles size={31} aria-hidden />
        <p className={style.text}>{t('home.jackpot')}</p>
        <h2 className={style.title} id="jackpot-title">{t(`heroes.${hero.id}.jackpot`)}</h2>
        <p className={style.text}>{t(`heroes.${hero.id}.cinematic`)}</p>
        {damage > 0 && <p className={style.damage}>{t('combatFeedback.attack', { value: damage })}</p>}
        <Action onClick={onDismiss}>{t('battle.skip')}</Action>
      </div>
    </dialog>
  )
}

export default JackpotCinematicController
