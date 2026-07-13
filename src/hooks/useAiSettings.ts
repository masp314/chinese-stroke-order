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
    const next: AiSettings = { ...settings, proxyUrl: url.trim() }
    setSettings(next)
    persist(next)
  }, [settings])

  const unlock = useCallback((code: string): boolean => {
    if (code.trim() === UNLOCK_CODE) {
      const next: AiSettings = { ...settings, unlocked: true }
      setSettings(next)
      persist(next)
      return true
    }
    return false
  }, [settings])

  const lock = useCallback(() => {
    const next: AiSettings = { ...settings, unlocked: false }
    setSettings(next)
    persist(next)
  }, [settings])

  return {
    proxyUrl: settings.proxyUrl,
    isConfigured: settings.proxyUrl.length > 0,
    isUnlimited: settings.unlocked,
    setProxyUrl,
    unlock,
    lock,
  }
}
