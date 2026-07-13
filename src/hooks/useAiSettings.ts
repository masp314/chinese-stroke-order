import { useCallback, useState } from 'react'

const STORAGE_KEY = 'hanzi-steps.ai-settings.v1'

interface AiSettings {
  proxyUrl: string
}

function load(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiSettings>
      if (typeof parsed.proxyUrl === 'string') return { proxyUrl: parsed.proxyUrl }
    }
  } catch { /* ignore corrupt data */ }
  return { proxyUrl: '' }
}

function persist(settings: AiSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* localStorage full — silently ignore */ }
}

export function useAiSettings() {
  const [settings, setSettings] = useState(load)

  const setProxyUrl = useCallback((url: string) => {
    const next: AiSettings = { proxyUrl: url.trim() }
    setSettings(next)
    persist(next)
  }, [])

  return {
    proxyUrl: settings.proxyUrl,
    isConfigured: settings.proxyUrl.length > 0,
    setProxyUrl,
  }
}
