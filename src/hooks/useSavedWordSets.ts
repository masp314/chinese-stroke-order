import { useState } from 'react'
import type { SavedWordSet } from '../types'

const STORAGE_KEY = 'hanzi-steps.saved-word-sets.v1'

function readSavedSets(): SavedWordSet[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SavedWordSet => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<SavedWordSet>
      return typeof candidate.id === 'string' && typeof candidate.title === 'string' && typeof candidate.text === 'string'
    })
  } catch {
    return []
  }
}

export function useSavedWordSets() {
  const [sets, setSets] = useState<SavedWordSet[]>(readSavedSets)
  const [storageError, setStorageError] = useState('')

  function persist(next: SavedWordSet[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSets(next)
      setStorageError('')
      return true
    } catch {
      setStorageError('Could not save on this device. Browser storage may be unavailable or full.')
      return false
    }
  }

  function save(title: string, text: string) {
    const item: SavedWordSet = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      title: title.trim(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }
    return persist([item, ...sets])
  }

  function remove(id: string) {
    persist(sets.filter((item) => item.id !== id))
  }

  return { sets, storageError, save, remove }
}
