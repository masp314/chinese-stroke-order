import { useState } from 'react'
import type { VocabEntry } from '../hooks/useVocabulary'

interface VocabularyPanelProps {
  entries: VocabEntry[]
  onDelete: (id: string) => void
  onSpeak: (text: string) => void
  onPractise?: (text: string) => void
}

const COLLAPSED_COUNT = 5

export function VocabularyPanel({ entries, onDelete, onSpeak, onPractise }: VocabularyPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (entries.length === 0) return null

  const showAll = expanded || entries.length <= COLLAPSED_COUNT
  const visible = showAll ? entries : entries.slice(0, COLLAPSED_COUNT)

  return (
    <section id="vocabulary" className="vocabulary-card" aria-labelledby="vocabulary-heading">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">MY VOCABULARY</p>
          <h2 id="vocabulary-heading">Saved words</h2>
        </div>
        <span className="local-badge">{entries.length} words</span>
      </div>

      <div className={`vocab-list ${showAll && entries.length > COLLAPSED_COUNT ? 'vocab-list-scroll' : ''}`}>
        {visible.map((entry) => (
          <div key={entry.id} className="vocab-item">
            <div className="vocab-item-main">
              <span className="vocab-word">{entry.word}</span>
              <span className="vocab-pinyin">{entry.pinyin}</span>
              {entry.pos && <span className="word-def-pos">{entry.pos}</span>}
            </div>
            <div className="vocab-item-meaning">
              {entry.definitionJa && <span className="vocab-ja">{entry.definitionJa}</span>}
              <span className="vocab-en">{entry.definitionsEn.slice(0, 3).join('; ')}</span>
            </div>
            <div className="vocab-item-actions">
              <button type="button" onClick={() => onSpeak(entry.word)} title="Speak">🔊</button>
              {onPractise && <button type="button" onClick={() => onPractise(entry.word)} title="Practise">✎</button>}
              <button type="button" onClick={() => { if (window.confirm(`Delete "${entry.word}"?`)) onDelete(entry.id) }} title="Delete">✕</button>
            </div>
          </div>
        ))}
      </div>

      {entries.length > COLLAPSED_COUNT && (
        <button type="button" className="text-button vocab-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : `Show all (${entries.length} words)`}
        </button>
      )}
    </section>
  )
}
