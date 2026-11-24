import {
  useEffect, useEffectEvent, useId, useState
} from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Coins,
  Dices,
  Flame,
  Footprints,
  Gem,
  Layers,
  ScrollText,
  Shield,
  Swords,
} from 'lucide-react'

import { useGame } from '@/store/game'
import { heroes } from '@/game/content/heroes'
import { items } from '@/game/content/items'
import { resolveLocationVisuals } from '@/game/content/visual-themes'
import { locations } from '@/game/content/world'
import { heroStats } from '@/game/core/battle'
import { automaticGame, canChoose, chapterReward } from '@/game/core/story'
import { campGames, campPrize } from '@/game/core/trials'

import Action from '@/components/Action'
import Meter from '@/components/Meter'
import ArtifactArt from '@/modules/Journal/ArtifactArt'

import ChallengeSelection from './ChallengeSelection'

import style from './index.module.scss'

const icons = {
  battle: Swords,
  blackjack: Layers,
  dice: Dices,
  coin: Coins,
  negotiate: ScrollText,
  corrupt: Flame,
  useArtifact: Gem,
  distract: Flame,
  sneak: Footprints,
}

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
  const descriptionId = useId()
  const games = node.actions.filter(
    (action) => action.game && canChoose(action, progress)
  )
  const alternatives = node.actions.filter((action) => !action.game)
  const decisions =
    games.length === 1 ? [...games, ...alternatives] : alternatives
  const select = (action) => command({ type: 'choose', action })

  return (
    <>
      {games.length > 1 && (
        <ChallengeSelection options={games} busy={busy} onSelect={select} />
      )}
      {decisions.length > 0 && (
        <ul className={style.choices} aria-label={t('story.choice')}>
          {decisions.map((action) => {
            const Icon = icons[action.id] || ScrollText
            const available = canChoose(action, progress)
            const label = t(
              action.title
                ? `chronicle.actions.${action.title}.name`
                : `choice.${action.id}`
            )
            const detail = available
              ? action.title
                ? `chronicle.actions.${action.title}.effect`
                : `story.choiceEffect.${action.id}`
              : `requirements.${action.id}`
            const id = `${descriptionId}-${action.id}`
            return (
              <li className={style.choice} key={action.id}>
                <Action
                  className={style.choiceButton}
                  variant="secondary"
                  data-primary={!!action.game}
                  data-locked={!available}
                  disabled={!available || busy}
                  aria-label={label}
                  aria-describedby={id}
                  onClick={() => select(action.id)}
                >
                  <span className={style.choiceIcon} aria-hidden>
                    <Icon size={19} />
                  </span>
                  <span className={style.choiceName}>{label}</span>
                  <span className={style.requirement} id={id}>
                    {t(detail)}
                  </span>
                  {available && (
                    <ChevronRight
                      className={style.choiceArrow}
                      size={16}
                      aria-hidden
                    />
                  )}
                </Action>
              </li>
            )
          })}
        </ul>
      )}
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
  const item = items[reward.item]
  const stats = heroStats(hero, progress)
  const levels =
    1 + Math.floor((progress.xp + reward.xp) / hero.progression.xpStep)
  const equipped = progress.equipped.includes(reward.item)
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
      <ul className={style.loot}>
        <li className={style.currency}>
          <Coins size={18} aria-hidden />
          {t('story.coins', { value: reward.coins })}
        </li>
        <li className={style.currency}>
          <BookOpen size={18} aria-hidden />
          {t('story.xp', { value: reward.xp })}
        </li>
        {levels > progress.level && (
          <li className={style.level}>
            {t('story.levelReward', { value: levels })}
          </li>
        )}
      </ul>
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
          {t('story.claim')}
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
      {node.line && (
        <details className={style.talk}>
          <summary className={style.talkToggle}>
            {t('story.talk', { name: t(heroes[node.speaker].nameKey) })}
          </summary>
          <Dialogue
            speaker={heroes[node.speaker]}
            text={t(`chronicle.lines.${node.line}.text`)}
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
        {games.length === 1 && (
          <Action
            variant="secondary"
            disabled={busy}
            onClick={() => play(games[0])}
          >
            {t(`story.campTrial.${games[0]}`)}
          </Action>
        )}
        {games.length > 1 && (
          <Action
            variant="secondary"
            aria-expanded={choosing}
            onClick={() => setChoosing(!choosing)}
          >
            {t('story.side')}
          </Action>
        )}
      </div>
      {choosing && games.length > 1 && (
        <ChallengeSelection
          options={games.map((game) => ({
            id: game,
            game,
            trialRewards: { win: campPrize(game) },
          }))}
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
  const title = node.line
    ? t(`chronicle.lines.${node.line}.title`)
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
  const line = node.line && t(`chronicle.lines.${node.line}.text`)
  const description =
    node.type === 'dialogue'
      ? null
      : final
        ? t(`heroes.${hero.id}.ending`)
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
