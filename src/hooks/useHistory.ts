import { useState } from 'react'
import type { HistoryItem } from '../types'

const STORAGE_KEY = 'hanzi-steps.history.v1'
const HISTORY_LIMIT = 30

function readHistory(): HistoryItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is HistoryItem => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<HistoryItem>
      return typeof candidate.text === 'string' && typeof candidate.lastUsedAt === 'string'
    }).slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(readHistory)

  function persist(next: HistoryItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setItems(next)
    } catch {
      // History is helpful but must never block practice if storage is unavailable.
    }
  }

  function record(text: string) {
    const normalized = text.trim()
    if (!normalized) return
    const next = [
      { text: normalized, lastUsedAt: new Date().toISOString() },
      ...items.filter((item) => item.text !== normalized),
    ].slice(0, HISTORY_LIMIT)
    persist(next)
  }

  function clear() {
    persist([])
  }

  return { items, record, clear }
}
