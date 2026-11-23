import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PackageOpen } from 'lucide-react'

import { useGame } from '@/store/game'
import { items } from '@/game/content/items'
import { heroStats } from '@/game/core/battle'

import Action from '@/components/Action'

import ArtifactArt from '../ArtifactArt'

import style from './index.module.scss'

const slots = 2
const signed = (value) => (value > 0 ? `+${value}` : String(value))

const Inventory = ({ hero, progress, command, save }) => {
  const t = useTranslations()
  const busy = useGame((state) => state.busy)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const stats = heroStats(hero, progress)
  const base = heroStats(hero, { ...progress, equipped: [] })
  const bonuses = Object.entries(stats).filter(
    ([id, value]) => value !== base[id]
  )
  const filters = [
    ...new Set(
      progress.inventory.flatMap((id) => Object.keys(items[id].effects))
    ),
  ]
  const visible = progress.inventory.filter(
    (id) => filter === 'all' || Object.hasOwn(items[id].effects, filter)
  )
  const id = visible.includes(selected) ? selected : visible[0]
  const item = items[id]
  const equipped = progress.equipped.includes(id)
  const blocked = progress.event || progress.side?.active
  const full = !equipped && progress.equipped.length >= slots
  const reason = blocked
    ? t('journal.equipmentBlocked')
    : full
      ? t('journal.slotsFull')
      : undefined
  const showEquipment = (id) => {
    setFilter('all')
    setSelected(id)
  }

  return (
    <div className={style.block}>
      <section className={style.panel}>
        <h2>{t('journal.equipped')}</h2>
        <p className={style.meta}>
          {t('inventory.slots', { value: progress.equipped.length })}
        </p>
        <div className={style.slots}>
          {Array.from({ length: slots }, (_, index) => {
            const equippedId = progress.equipped[index]
            return equippedId ? (
              <button
                className={style.slot}
                key={index}
                type="button"
                aria-pressed={id === equippedId}
                onClick={() => showEquipment(equippedId)}
              >
                <ArtifactArt id={equippedId} className={style.art} />
                {t(`items.${equippedId}.name`)}
              </button>
            ) : (
              <div className={style.slot} key={index}>
                <PackageOpen size={23} aria-hidden />
                {t('journal.emptySlot')}
              </div>
            )
          })}
        </div>
        {bonuses.length > 0 && (
          <ul className={style.bonuses}>
            {bonuses.map(([stat, value]) => (
              <li
                key={stat}
                className={style.delta}
                data-positive={value > base[stat]}
              >
                {signed(value - base[stat])} {t(`game.${stat}`)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={style.panel}>
        <header className={style.heading}>
          <div>
            <h2>{t('journal.artifacts')}</h2>
            <p className={style.meta}>
              {t('inventory.collection', {
                value: save.collection.length,
                total: Object.keys(items).length,
              })}
            </p>
          </div>
          <label className={style.filter}>
            {t('journal.filter')}
            <select
              className={style.select}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">{t('journal.all')}</option>
              {filters.map((stat) => (
                <option key={stat} value={stat}>
                  {t(`game.${stat}`)}
                </option>
              ))}
            </select>
          </label>
        </header>
        <div className={style.grid}>
          {visible.map((artifact) => (
            <button
              className={style.item}
              key={artifact}
              type="button"
              aria-pressed={id === artifact}
              data-rarity={items[artifact].rarity}
              onClick={() => setSelected(artifact)}
            >
              <ArtifactArt id={artifact} className={style.art} />
              <strong className={style.itemName}>
                {t(`items.${artifact}.name`)}
              </strong>
              <span className={style.meta}>
                {t(`inventory.${items[artifact].rarity}`)}
              </span>
              {progress.equipped.includes(artifact) && (
                <span className={style.equipped}>{t('journal.equipped')}</span>
              )}
            </button>
          ))}
        </div>
        {item ? (
          <section className={style.details} aria-label={t(`items.${id}.name`)}>
            <ArtifactArt id={id} className={style.art} />
            <div className={style.copy}>
              <h3>{t(`items.${id}.name`)}</h3>
              <p className={style.meta}>{t(`inventory.${item.rarity}`)}</p>
              <p>{t(`items.${id}.description`)}</p>
              <ul className={style.bonuses}>
                {Object.entries(item.effects).map(([stat, value]) => {
                  const delta = equipped ? -value : value
                  return (
                    <li
                      key={stat}
                      className={style.delta}
                      data-positive={delta > 0}
                    >
                      {signed(delta)} {t(`game.${stat}`)} · {stats[stat]} →{' '}
                      {stats[stat] + delta}
                    </li>
                  )
                })}
              </ul>
              {reason && <p className={style.meta}>{reason}</p>}
              <Action
                disabled={busy || !!reason}
                onClick={() => command({ type: 'equip', id })}
              >
                {t(equipped ? 'inventory.remove' : 'inventory.equip')}
              </Action>
            </div>
          </section>
        ) : (
          <p className={style.meta}>{t('journal.noItems')}</p>
        )}
      </section>
    </div>
  )
}

export default Inventory
