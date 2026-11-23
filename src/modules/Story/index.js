import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Backpack,
  BookOpen,
  Coins,
  Dices,
  Flag,
  Flame,
  Gem,
  Layers,
  ScrollText,
  Shield,
  Swords,
} from 'lucide-react'

import { useGame } from '@/store/game'
import { locationArt } from '@/game/content/assets'
import { campaigns, locations } from '@/game/content/world'
import { canChoose } from '@/game/core/story'

import Action from '@/components/Action'

import style from './index.module.scss'

const icons = {
  battle: Swords,
  dice: Dices,
  blackjack: Layers,
  negotiate: ScrollText,
  corrupt: Flame,
  useArtifact: Gem,
}
const statuses = {
  dialogue: BookOpen,
  checkpoint: Shield,
  choice: ScrollText,
  reward: Backpack,
  camp: Flame,
  end: Flag,
}

const Story = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const locale = useLocale()
  const busy = useGame((state) => state.busy)
  const advance = () => command({ type: 'advance' })
  const choice = node.type === 'choice'
  const final = node.type === 'end'
  const stage =
    progress.chapter === 0
      ? 'opening'
      : progress.chapter === hero.route.length - 1
        ? 'finale'
        : 'mission'
  const showDialogue =
    stage !== 'mission' ||
    progress.chapter === 1 ||
    progress.chapter === Math.ceil(hero.route.length / 2)
  const StatusIcon = statuses[node.type]
  const coinReward = progress.result === 'loss' ? 4 : node.reward?.coins

  return (
    <article className={style.block}>
      <div className={style.banner}>
        <Image className={style.bannerImage}
          src={locationArt[node.location] || campaigns[hero.campaignId].image}
          fill
          sizes="(max-width: 768px) 100vw, 75vw"
          alt=""
        />
        <div className={style.bannerText}>
          <p className={style.chapter}>
            {t(`campaigns.${hero.campaignId}.name`)} ·{' '}
            {t('story.chapter', { chapter: node.chapter + 1 })}
          </p>
          <h1 className={style.location}>{locations[node.location].names[locale]}</h1>
        </div>
      </div>
      <div className={style.content}>
        <p className={style.eyebrow}>
          {StatusIcon && <StatusIcon size={17} aria-hidden />}
          {t(`story.${node.type}`)}
        </p>
        <h2 className={style.quest}>{t(`heroes.${hero.id}.quest`)}</h2>
        {node.type === 'dialogue' ? (
          <>
            <p className={style.description}>{t(`landmarks.${node.location}`)}</p>
            {showDialogue && (
              <blockquote className={style.quote}>
                <cite className={style.speaker}>{t(hero.nameKey)}</cite>
                <p className={style.quoteText}>{t(`heroes.${hero.id}.${stage}`)}</p>
              </blockquote>
            )}
            {progress.flags.accord > 0 && <p className={style.description}>{t('story.accord')}</p>}
            {progress.flags.forged > 0 && <p className={style.description}>{t('story.forged')}</p>}
          </>
        ) : (
          <p className={style.description}>
            {final
              ? t(`heroes.${hero.id}.ending`)
              : t(`story.${node.boss ? 'boss' : node.type}Text`)}
          </p>
        )}
        {choice && (
          <div className={style.actions}>
            {node.actions.map((action, index) => {
              const Icon = icons[action.id]
              const available = canChoose(action, progress)
              return (
                <div className={style.choice} key={action.id}>
                  <Action
                    variant={index === 0 ? 'primary' : 'secondary'}
                    disabled={!available || busy}
                    onClick={() =>
                      command({ type: 'choose', action: action.id })
                    }
                  >
                    <Icon size={17} aria-hidden />
                    {t(`choice.${action.id}`)}
                  </Action>
                  {!available && <p className={style.requirement}>{t(`requirements.${action.id}`)}</p>}
                </div>
              )
            })}
            <Action href="/play/world" variant="ghost">
              {t('choice.retreat')}
            </Action>
          </div>
        )}
        {node.type === 'reward' && (
          <ul className={style.loot}>
            <li className={style.reward}>
              <Coins size={18} aria-hidden />
              {t('story.coins', { value: coinReward })}
            </li>
            <li className={style.reward}>
              <BookOpen size={18} aria-hidden />
              {t('story.xp', { value: node.reward.xp })}
            </li>
            {node.reward.item && (
              <li className={style.reward}>
                <Gem size={18} aria-hidden />
                {t(`items.${node.reward.item}.name`)}
              </li>
            )}
          </ul>
        )}
        {!choice && (
          <div className={style.actions}>
            {final ? (
              <Action href="/play/campaign">{t('story.newJourney')}</Action>
            ) : (
              <Action disabled={busy} onClick={advance}>
                {t(`story.${node.type === 'reward' ? 'claim' : 'continue'}`)}
              </Action>
            )}
            {node.type === 'camp' && !progress.side && (
              <Action
                variant="secondary"
                disabled={busy}
                onClick={() => command({ type: 'side' })}
              >
                {t('story.side')}
              </Action>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default Story
