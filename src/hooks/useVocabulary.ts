import { useState } from 'react'

const STORAGE_KEY = 'hanzi-steps.vocabulary.v1'

export interface VocabEntry {
  id: string
  word: string
  pinyin: string
  pos: string
  definitionsEn: string[]
  definitionJa: string
  savedAt: string
}

function readEntries(): VocabEntry[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is VocabEntry =>
      !!item && typeof item === 'object'
      && typeof (item as VocabEntry).id === 'string'
      && typeof (item as VocabEntry).word === 'string',
    )
  } catch {
    return []
  }
}

export function useVocabulary() {
  const [entries, setEntries] = useState<VocabEntry[]>(readEntries)

  function persist(next: VocabEntry[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setEntries(next)
    } catch { /* storage full */ }
  }

  function save(entry: Omit<VocabEntry, 'id' | 'savedAt'>) {
    const item: VocabEntry = {
      ...entry,
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      savedAt: new Date().toISOString(),
    }
    persist([item, ...entries])
  }

  function remove(id: string) {
    persist(entries.filter((e) => e.id !== id))
  }

  function isSaved(word: string) {
    return entries.some((e) => e.word === word)
  }

  return { entries, save, remove, isSaved }
}
