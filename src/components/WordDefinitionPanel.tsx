import { useEffect, useState } from 'react'
import { lookupWord, type WordDefinition } from '../utils/dictionary'

interface WordDefinitionPanelProps {
  word: string
  aiProxyUrl: string
}

interface JaTranslation {
  ja: string
  pos: string
}

const jaCache = new Map<string, JaTranslation>()

async function fetchJaTranslation(word: string, definitions: string[], proxyUrl: string): Promise<JaTranslation> {
  const cached = jaCache.get(word)
  if (cached) return cached

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        translate: { word, definitions },
      }),
    })
    if (!response.ok) return { ja: '', pos: '' }
    const data = await response.json() as { ja?: string; pos?: string }
    const result: JaTranslation = { ja: data.ja ?? '', pos: data.pos ?? '' }
    jaCache.set(word, result)
    return result
  } catch {
    return { ja: '', pos: '' }
  }
}

export function WordDefinitionPanel({ word, aiProxyUrl }: WordDefinitionPanelProps) {
  const [defs, setDefs] = useState<WordDefinition[]>([])
  const [ja, setJa] = useState<JaTranslation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!word) {
      setDefs([])
      setJa(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setJa(null)

    lookupWord(word).then((results) => {
      if (cancelled) return
      setDefs(results)
      setLoading(false)

      if (results.length > 0 && aiProxyUrl) {
        const allDefs = results.flatMap((r) => r.definitions)
        fetchJaTranslation(word, allDefs, aiProxyUrl).then((translation) => {
          if (!cancelled) setJa(translation)
        })
      }
    })

    return () => { cancelled = true }
  }, [word, aiProxyUrl])

  if (!word) return null
  if (loading) return <div className="word-def-panel"><p className="word-def-loading">Loading dictionary...</p></div>
  if (defs.length === 0) return <div className="word-def-panel"><p className="word-def-empty">No dictionary entry for "{word}"</p></div>

  return (
    <div className="word-def-panel">
      {defs.map((def, i) => (
        <div key={i} className="word-def-entry">
          <div className="word-def-header">
            <span className="word-def-char">{def.simplified}</span>
            {def.traditional && <span className="word-def-trad">({def.traditional})</span>}
            <span className="word-def-pinyin">{def.pinyin}</span>
            {ja?.pos && i === 0 && <span className="word-def-pos">{ja.pos}</span>}
          </div>
          <ul className="word-def-list">
            {def.definitions.map((d, j) => (
              <li key={j}>{d}</li>
            ))}
          </ul>
        </div>
      ))}
      {ja?.ja && (
        <div className="word-def-ja">
          <span className="word-def-ja-label">日本語</span>
          <span>{ja.ja}</span>
        </div>
      )}
    </div>
  )
}
