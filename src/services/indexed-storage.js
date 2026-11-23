import { initialSave } from '../game/core/session.js'

import { validateSave } from './save-schema.js'

export const createIndexedStorage = (factory, name = 'fate-of-the-ring') => {
  let connection
  const open = () => {
    connection ||= new Promise((resolve, reject) => {
      const request = factory.open(name, 1)
      request.onupgradeneeded = () => request.result.createObjectStore('saves')
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => {
          db.close()
          connection = undefined
        }
        resolve(db)
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('storage-blocked'))
    }).catch((error) => {
      connection = undefined
      throw error
    })
    return connection
  }

  const transact = async (mode, mutate, replace = false) => {
    const db = await open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', mode)
      const store = tx.objectStore('saves')
      const request = store.get('current')
      let output
      let failure
      request.onsuccess = () => {
        try {
          const current = replace
            ? initialSave()
            : request.result
              ? validateSave(request.result)
              : initialSave()
          output = mutate ? mutate(current) : current
          if (mutate && (output !== current || replace)) {
            output = {
              ...output,
              revision: (request.result?.revision || 0) + 1,
            }
            store.put(output, 'current')
          }
        } catch (error) {
          failure = error
          tx.abort()
        }
      }
      tx.oncomplete = () => resolve(output)
      tx.onabort = () =>
        reject(failure || tx.error || new Error('storage-abort'))
    })
  }
  return {
    load: () => transact('readonly'),
    update: (mutate) => transact('readwrite', mutate),
    replace: (data) => transact('readwrite', () => validateSave(data), true),
  }
}
