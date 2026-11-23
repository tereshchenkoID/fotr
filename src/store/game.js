'use client'

import { create } from 'zustand'

import { applyCommand, initialSave } from '@/game/core/session'
import { createIndexedStorage } from '@/services/indexed-storage'

let storage
let channel
const getStorage = () => (storage ||= createIndexedStorage(window.indexedDB))
const errorKey = (error) =>
  ['save-version', 'save-invalid'].includes(error.message)
    ? 'invalidSave'
    : 'storageError'

export const useGame = create((set, get) => {
  const sync = async () => {
    try {
      const save = await getStorage().load()
      if (!get().save || save.revision >= get().save.revision)
        set({ save, error: null })
    } catch (error) {
      set({ error: errorKey(error) })
    }
  }

  const write = async (operation) => {
    if (get().busy) return false
    set({ busy: true, error: null })
    try {
      const save = await operation(getStorage())
      set({ save, busy: false })
      channel?.postMessage(save.revision)
      return true
    } catch (error) {
      set({ error: errorKey(error), busy: false })
      return false
    }
  }

  return {
    save: null,
    busy: false,
    error: null,
    hydrate: async () => {
      if (!channel && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('fate-of-the-ring')
        channel.onmessage = sync
      }
      await sync()
    },
    dispatch: (command) =>
      write((adapter) => adapter.update((save) => applyCommand(save, command))),
    importSave: (save) => write((adapter) => adapter.replace(save)),
    reset: () => write((adapter) => adapter.replace(initialSave())),
    reportInvalid: () => set({ error: 'invalidSave' }),
  }
})
