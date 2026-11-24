import { useTranslations } from 'next-intl'
import {
  Coins, Dices, Info, Layers
} from 'lucide-react'

import { useGame } from '@/store/game'
import { enemyArt } from '@/game/content/assets'
import { heroes } from '@/game/content/heroes'
import { stories } from '@/game/content/stories'
import { resolveTrialVisuals } from '@/game/content/visual-themes'
import { trialTurn } from '@/game/core/session'
import { nextReward, trialOutcome } from '@/game/core/trials'

import Action from '@/components/Action'
import Disclosure from '@/components/Disclosure'
import RewardSummary from '@/components/RewardSummary'
import VisualScene from '@/modules/VisualScene'

import Blackjack from './Blackjack'
import Coin from './Coin'
import Dice from './Dice'
import TrialOutcome from './TrialOutcome'

import style from './index.module.scss'

const icons = { blackjack: Layers, dice: Dices, coin: Coins }

const Trials = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const busy = useGame((state) => state.busy)
  const event = node.side ? progress.side.game : progress.event
  const cards = node.type === 'blackjack'
  const coin = node.type === 'coin'
  const Icon = icons[node.type]
  const visuals = resolveTrialVisuals(hero.campaignId, progress.location, node)
  const play = (action, index) =>
    command({ type: 'play', action, index, turn: trialTurn(node.type, event) })

  const opponent = node.speaker
    ? {
      name: t(heroes[node.speaker].nameKey),
      portrait: heroes[node.speaker].portrait,
    }
    : node.dealer
      ? { name: t(`trials.dealers.${node.dealer}`) }
      : node.enemy
        ? { name: t(`enemies.${node.enemy}`), portrait: enemyArt[node.enemy] }
        : { name: t(`trials.dealers.${visuals.table}`) }
  const prize = event.result && trialOutcome(
    node, event, node.side ? null : nextReward(stories[hero.id], node), progress
  ).reward
  const result = event.result && (
    <div className={style.result} data-result={event.result}>
      {!cards && <TrialOutcome outcome={event.result} />}
      <p className={style.description}>
        {t(`trials.${node.side ? 'side' : 'main'}${event.result}`)}
      </p>
      <RewardSummary reward={prize} />
      <Action disabled={busy} onClick={() => command({ type: 'advance' })}>
        {t('story.continue')}
      </Action>
    </div>
  )

  return (
    <VisualScene
      className={style.block}
      visuals={visuals}
      scenery={false}
    >
      <header className={style.heading}>
        {node.side && <p className={style.description}>{t('story.side')}</p>}
        <h1 className={style.title}>
          <Icon
            className={style.icon}
            size={23}
            strokeWidth={1.5}
            aria-hidden
          />
          {t(`nav.${node.type}`)}
        </h1>
        <Disclosure
          className={style.rules}
          toggleClassName={style.ruleButton}
          label={t('challenge.rulesLabel')}
          panel={<p className={style.rulePanel}>{t(`rules.${node.type}`)}</p>}
        >
          <Info size={17} aria-hidden />
        </Disclosure>
      </header>
      {cards ? (
        <Blackjack
          event={event}
          play={play}
          busy={busy}
          result={result}
          visuals={visuals}
          dealerName={node.speaker ? opponent.name : undefined}
          dealerKey={node.dealer}
        />
      ) : coin ? (
        <Coin
          event={event}
          play={play}
          busy={busy}
          result={result}
          theme={visuals.coin}
          heroName={t(hero.nameKey)}
          opponent={opponent.name}
        />
      ) : (
        <Dice
          event={event}
          play={play}
          busy={busy}
          result={result}
          material={visuals.theme.material}
          heroName={t(hero.nameKey)}
          opponent={opponent}
        />
      )}
    </VisualScene>
  )
}

export default Trials
