import { useCallback, useState } from 'react'

const STORAGE_KEY = 'hanzi-steps.ai-settings.v1'
const DEFAULT_PROXY_URL = 'https://hanzi-ai-proxy.masuda-a4c.workers.dev'
const UNLOCK_CODE = 'hanzi2026'

interface AiSettings {
  proxyUrl: string
  unlocked: boolean
}

function load(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiSettings>
      return {
        proxyUrl: typeof parsed.proxyUrl === 'string' ? parsed.proxyUrl : DEFAULT_PROXY_URL,
        unlocked: parsed.unlocked === true,
      }
    }
  } catch { /* ignore corrupt data */ }
  return { proxyUrl: DEFAULT_PROXY_URL, unlocked: false }
}

function persist(settings: AiSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* localStorage full — silently ignore */ }
}

export function useAiSettings() {
  const [settings, setSettings] = useState(load)

  const setProxyUrl = useCallback((url: string) => {
    setSettings((prev) => {
      const next: AiSettings = { ...prev, proxyUrl: url.trim() }
      persist(next)
      return next
    })
  }, [])

  const unlock = useCallback((code: string): boolean => {
    if (code.trim() === UNLOCK_CODE) {
      setSettings((prev) => {
        const next: AiSettings = { ...prev, unlocked: true }
        persist(next)
        return next
      })
      return true
    }
    return false
  }, [])

  const lock = useCallback(() => {
    setSettings((prev) => {
      const next: AiSettings = { ...prev, unlocked: false }
      persist(next)
      return next
    })
  }, [])

  return {
    proxyUrl: settings.proxyUrl,
    isConfigured: settings.proxyUrl.length > 0,
    isUnlimited: settings.unlocked,
    setProxyUrl,
    unlock,
    lock,
  }
}
