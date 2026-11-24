import { useTranslations } from 'next-intl'
import { Dices, Layers } from 'lucide-react'

import { useGame } from '@/store/game'
import { enemyArt } from '@/game/content/assets'
import { heroes } from '@/game/content/heroes'
import { resolveTrialVisuals } from '@/game/content/visual-themes'
import { trialTurn } from '@/game/core/session'

import Action from '@/components/Action'
import VisualScene from '@/modules/VisualScene'

import Blackjack from './Blackjack'
import Dice from './Dice'

import style from './index.module.scss'

const Trials = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const busy = useGame((state) => state.busy)
  const event = node.side ? progress.side.game : progress.event
  const cards = node.type === 'blackjack'
  const Icon = cards ? Layers : Dices
  const visuals = resolveTrialVisuals(hero.campaignId, progress.location, node)
  const play = (action, index) => command({ type: 'play', action, index, turn: trialTurn(node.type, event) })

  const result = event.result && (
    <div className={style.result} data-result={event.result}>
      <p className={style.description}>{t(`trials.${node.side ? 'side' : 'main'}${event.result}`)}</p>
      <Action disabled={busy} onClick={() => command({ type: 'advance' })}>
        {t('story.continue')}
      </Action>
    </div>
  )

  return (
    <VisualScene
      className={cards ? style.block : `${style.block} ${style.duel}`}
      visuals={visuals}
      scenery={false}
    >
      <header className={style.heading}>
        {cards && <Icon className={style.icon} size={30} strokeWidth={1.4} aria-hidden />}
        {node.side && <p className={style.description}>{t('story.side')}</p>}
        <h1 className={style.title}>
          {!cards && <Icon className={style.icon} size={24} strokeWidth={1.5} aria-hidden />}
          {t(`nav.${node.type}`)}
        </h1>
        {!cards && <p className={style.description}>{t('rules.dice')}</p>}
        {node.side && <p className={style.description}>{t(node.speaker ? 'chronicle.campDice' : `trials.camp.${hero.campaignId}`)}</p>}
      </header>
      {cards ? (
        <Blackjack event={event} play={play} busy={busy} result={result} visuals={visuals} dealerName={node.dealer} />
      ) : (
        <Dice
          event={event}
          play={play}
          busy={busy}
          material={visuals.theme.material}
          heroName={t(hero.nameKey)}
          opponent={node.enemy
            ? { name: t(`enemies.${node.enemy}`), portrait: enemyArt[node.enemy] }
            : node.speaker
              ? { name: t(heroes[node.speaker].nameKey), portrait: heroes[node.speaker].portrait }
              : { name: t(`trials.dealers.${visuals.table}`) }}
          result={result}
        />
      )}
    </VisualScene>
  )
}

export default Trials
