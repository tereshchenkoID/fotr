import { useEffect, useEffectEvent, useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, Shield } from 'lucide-react'

import { useGame } from '@/store/game'
import { heroes } from '@/game/content/heroes'
import { items } from '@/game/content/items'
import { resolveLocationVisuals } from '@/game/content/visual-themes'
import { locations } from '@/game/content/world'
import { heroStats } from '@/game/core/battle'
import { automaticGame, chapterReward, storyLine } from '@/game/core/story'
import { campGames, campPrize } from '@/game/core/trials'

import Action from '@/components/Action'
import Meter from '@/components/Meter'
import RewardSummary from '@/components/RewardSummary'
import ArtifactArt from '@/modules/Journal/ArtifactArt'

import ChallengeSelection from './ChallengeSelection'

import style from './index.module.scss'

const Dialogue = ({ speaker, text, animate = true }) => {
  const t = useTranslations()
  const [revealing, setRevealing] = useState(animate)
  return (
    <blockquote className={style.quote}>
      <Image
        className={style.speakerPortrait}
        src={speaker.portrait}
        width={64}
        height={64}
        alt=""
      />
      <div className={style.speech}>
        <div className={style.speakerBar}>
          <cite className={style.speaker}>{t(speaker.nameKey)}</cite>
          {revealing && (
            <button
              className={style.skipText}
              type="button"
              onClick={() => setRevealing(false)}
            >
              {t('story.skipText')}
            </button>
          )}
        </div>
        <p
          className={style.quoteText}
          data-revealing={revealing}
          onAnimationEnd={() => setRevealing(false)}
        >
          {text}
        </p>
      </div>
    </blockquote>
  )
}

const Choices = ({ node, progress, busy, command }) => {
  const t = useTranslations()
  return (
    <>
      <ChallengeSelection
        options={node.actions}
        progress={progress}
        busy={busy}
        onSelect={(action) => command({ type: 'choose', action })}
      />
      <div className={style.choiceFooter}>
        {progress.checkpoint === node.id && (
          <p className={style.checkpoint}>
            <Shield size={15} aria-hidden />
            {t('story.checkpointSaved')}
          </p>
        )}
        <Action className={style.mapLink} href="/play/world" variant="ghost">
          <ArrowLeft size={16} aria-hidden />
          {t('choice.retreat')}
        </Action>
      </div>
    </>
  )
}

const Rewards = ({ hero, progress, node, busy, advance }) => {
  const t = useTranslations()
  const reward = chapterReward(node, progress)
  const item = items[reward?.item]
  const stats = heroStats(hero, progress)
  const levels =
    1 + Math.floor((progress.xp + (reward?.xp || 0)) / hero.progression.xpStep)
  const equipped = progress.equipped.includes(reward?.item)
  const canEquip = item && !equipped && progress.equipped.length < 2
  const equippedStats =
    canEquip &&
    heroStats(hero, {
      ...progress,
      level: levels,
      equipped: [...progress.equipped, item.id],
    })

  return (
    <>
      <RewardSummary reward={reward && { ...reward, item: null }}>
        {levels > progress.level && (
          <li className={style.level}>
            {t('story.levelReward', { value: levels })}
          </li>
        )}
      </RewardSummary>
      {item && (
        <section className={style.artifact} data-rarity={item.rarity}>
          <ArtifactArt id={item.id} className={style.artifactImage} />
          <div className={style.artifactCopy}>
            <p className={style.eyebrow}>{t(`inventory.${item.rarity}`)}</p>
            <h3 className={style.artifactName}>{t(`items.${item.id}.name`)}</h3>
            <p className={style.description}>
              {t(`items.${item.id}.description`)}
            </p>
            <ul className={style.loot}>
              {Object.entries(item.effects).map(([stat, bonus]) => (
                <li className={style.stat} key={stat}>
                  {t(`game.${stat}`)} +{bonus}
                  {canEquip && ` · ${stats[stat]} → ${equippedStats[stat]}`}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <div className={style.actions}>
        <Action disabled={busy} onClick={() => advance()}>
          {t(reward ? 'story.claim' : 'story.continue')}
        </Action>
        {canEquip && (
          <Action
            variant="secondary"
            disabled={busy}
            onClick={() => advance(item.id)}
          >
            {t('story.claimAndEquip')}
          </Action>
        )}
        {item && !canEquip && (
          <p className={style.description}>
            {t(equipped ? 'journal.equipped' : 'journal.slotsFull')}
          </p>
        )}
      </div>
    </>
  )
}

const Camp = ({ hero, progress, node, busy, command, advance }) => {
  const t = useTranslations()
  const stats = heroStats(hero, progress)
  const games = progress.side ? [] : campGames(node)
  const [choosing, setChoosing] = useState(false)
  const line = storyLine(node, progress)
  const play = (action) => command({ type: 'side', action })

  return (
    <>
      <div className={style.campStatus}>
        <Meter
          label={t('game.hp')}
          value={progress.hp}
          max={stats.hp}
          kind="health"
        />
        <p className={style.eyebrow}>
          {t('game.resumeLevel', { level: progress.level })}
        </p>
      </div>
      {line && (
        <details className={style.talk}>
          <summary className={style.talkToggle}>
            {t('story.talk', { name: t(heroes[node.speaker].nameKey) })}
          </summary>
          <Dialogue
            speaker={heroes[node.speaker]}
            text={t(`chronicle.lines.${line}.text`)}
            animate={false}
          />
        </details>
      )}
      <div className={style.actions}>
        <Action disabled={busy} onClick={() => advance()}>
          {t('story.continueJourney')}
        </Action>
        {progress.hp < stats.hp && (
          <Action
            variant="secondary"
            disabled={busy}
            onClick={() => command({ type: 'rest' })}
          >
            {t('story.rest')}
          </Action>
        )}
        <Action variant="secondary" href="/play/inventory">
          {t('nav.inventory')}
        </Action>
        {games.length > 0 && (
          <Action
            variant="secondary"
            aria-expanded={choosing}
            onClick={() => setChoosing(!choosing)}
          >
            {t('story.side')}
          </Action>
        )}
      </div>
      {choosing && games.length > 0 && (
        <ChallengeSelection
          options={games.map((game) => ({
            id: game,
            game,
            trialRewards: { win: campPrize(game) },
          }))}
          progress={progress}
          busy={busy}
          onSelect={play}
          camp
        />
      )}
    </>
  )
}

const Story = ({ hero, progress, node, command }) => {
  const t = useTranslations()
  const locale = useLocale()
  const busy = useGame((state) => state.busy)
  const advance = (equip) => command({ type: 'advance', equip })
  const automatic = automaticGame(node, progress)?.id
  const enterSavedScene = useEffectEvent(() =>
    automatic ? command({ type: 'choose', action: automatic }) : advance()
  )
  useEffect(() => {
    if (!busy && (node.type === 'checkpoint' || automatic))
      void enterSavedScene()
  }, [node.id, node.type, busy, automatic])

  const scene = resolveLocationVisuals(hero.campaignId, node.location, node)
  const place = locations[node.location].names[locale]
  const lineKey = storyLine(node, progress)
  const title = lineKey
    ? t(`chronicle.lines.${lineKey}.title`)
    : node.title
      ? t(`chronicle.titles.${node.title}.${node.type}`)
      : t(`story.${node.type}`)
  const speaker = heroes[node.speaker] || hero
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
  const line = lineKey && t(`chronicle.lines.${lineKey}.text`)
  const description =
    node.type === 'dialogue'
      ? null
      : final
        ? line || t(`heroes.${hero.id}.ending`)
        : node.type === 'camp'
          ? t(node.autoRest ? 'story.restedCamp' : 'story.campText')
          : line || t(`story.${node.boss ? 'boss' : node.type}Text`)

  return (
    <article
      className={style.block}
      data-light={scene.light}
      data-stage={node.type}
    >
      <header className={style.banner}>
        {scene.image && (
          <Image
            className={style.bannerImage}
            src={scene.image}
            fill
            sizes="(max-width: 768px) 100vw, 992px"
            style={
              scene.position ? { objectPosition: scene.position } : undefined
            }
            alt=""
          />
        )}
        <div className={style.bannerText}>
          <p className={style.chapter}>
            {t(`campaigns.${hero.campaignId}.name`)} ·{' '}
            {t('story.chapter', { chapter: node.chapter + 1 })}
          </p>
          <h1 className={style.location}>{place}</h1>
        </div>
      </header>
      <div className={style.content} key={node.id}>
        <h2 className={style.quest}>{title}</h2>
        {node.type === 'dialogue' ? (
          <>
            {!line && (
              <p className={style.description}>
                {t(`landmarks.${node.location}`)}
              </p>
            )}
            {(line || showDialogue) && (
              <Dialogue
                speaker={speaker}
                text={line || t(`heroes.${hero.id}.${stage}`)}
              />
            )}
            {!line && progress.flags.accord > 0 && (
              <p className={style.description}>{t('story.accord')}</p>
            )}
            {!line && progress.flags.forged > 0 && (
              <p className={style.description}>{t('story.forged')}</p>
            )}
            <div className={style.actions}>
              <Action disabled={busy} onClick={() => advance()}>
                {t('story.continue')}
              </Action>
            </div>
          </>
        ) : (
          (node.type !== 'choice' || line || node.boss) && (
            <p className={style.description}>{description}</p>
          )
        )}
        {node.type === 'choice' && !automatic && (
          <Choices
            node={node}
            progress={progress}
            busy={busy}
            command={command}
          />
        )}
        {node.type === 'reward' && (
          <Rewards
            hero={hero}
            progress={progress}
            node={node}
            busy={busy}
            advance={advance}
          />
        )}
        {node.type === 'camp' && (
          <Camp
            hero={hero}
            progress={progress}
            node={node}
            busy={busy}
            command={command}
            advance={advance}
          />
        )}
        {final && (
          <Action className={style.newJourney} href="/play/campaign">
            {t('story.newJourney')}
          </Action>
        )}
      </div>
    </article>
  )
}

export default Story
