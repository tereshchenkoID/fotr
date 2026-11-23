import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Download, RotateCcw, Upload } from 'lucide-react'

import { useGame } from '@/store/game'

import Action from '@/components/Action'

import journalStyle from '../index.module.scss'

const exportSave = (save) => {
  const file = new Blob([JSON.stringify(save, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = 'fate-of-the-ring-save.json'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const Settings = () => {
  const t = useTranslations()
  const save = useGame((state) => state.save)
  const busy = useGame((state) => state.busy)
  const importSave = useGame((state) => state.importSave)
  const reportInvalid = useGame((state) => state.reportInvalid)
  const reset = useGame((state) => state.reset)
  const fileInput = useRef(null)

  const read = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      if (file.size > 1_000_000) throw new Error('save-invalid')
      const parsed = JSON.parse(await file.text())
      if (window.confirm(t('settings.confirmImport'))) await importSave(parsed)
    } catch {
      reportInvalid()
    }
  }
  return (
    <article className={journalStyle.block}>
      <h1 className={journalStyle.title}>{t('nav.settings')}</h1>
      <section className={journalStyle.panel}>
        <h2>{t('settings.saves')}</h2>
        <p className={journalStyle.description}>{t('settings.local')}</p>
        <div className={journalStyle.actions}>
          <Action disabled={busy || !save} onClick={() => exportSave(save)}>
            <Download size={17} aria-hidden />
            {t('settings.export')}
          </Action>
          <Action
            variant="secondary"
            disabled={busy}
            onClick={() => fileInput.current.click()}
          >
            <Upload size={17} aria-hidden />
            {t('settings.import')}
          </Action>
          <Action
            variant="secondary"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t('settings.confirmReset'))) reset()
            }}
          >
            <RotateCcw size={17} aria-hidden />
            {t('settings.reset')}
          </Action>
          <input
            ref={fileInput}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={read}
          />
        </div>
      </section>
    </article>
  )
}

export default Settings
