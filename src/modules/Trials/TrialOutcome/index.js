import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Minus, X } from 'lucide-react'

import style from './index.module.scss'

const icons = { win: Check, loss: X, draw: Minus }

const TrialOutcome = ({ outcome, inline = false }) => {
  const t = useTranslations('results')
  const [initialOutcome] = useState(outcome)
  const Icon = icons[outcome]

  return (
    <div
      className={style.block}
      role="status"
      data-inline={inline}
      data-outcome={outcome || undefined}
      data-entering={!!outcome && !initialOutcome}
    >
      {Icon && (
        <span className={style.label}>
          <Icon size={20} aria-hidden />
          {t(outcome)}
        </span>
      )}
    </div>
  )
}

export default TrialOutcome
