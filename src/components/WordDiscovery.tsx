import { useState } from 'react'
import { pickRandomWords, WORD_LEVELS, type WordLevel } from '../data/levelWords'

interface Props { onAdd: (word: string) => void }

export function WordDiscovery({ onAdd }: Props) {
  const [level, setLevel] = useState<WordLevel>('K2')
  const [words, setWords] = useState(() => pickRandomWords('K2'))
  const refresh = (nextLevel = level) => setWords(pickRandomWords(nextLevel))

  return (
    <section className="word-discovery" aria-labelledby="word-discovery-title">
      <div className="word-discovery-heading">
        <div>
          <p className="eyebrow">DISCOVER</p>
          <h2 id="word-discovery-title">Try these words</h2>
          <p className="discovery-hint">Tap a word to add it to your input.</p>
        </div>
        <div className="discovery-controls">
          <label className="discovery-level">
            Level
            <select
              aria-label="Suggestion level"
              value={level}
              onChange={(e) => { const next = e.target.value as WordLevel; setLevel(next); refresh(next) }}
            >
              {WORD_LEVELS.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className="btn" onClick={() => refresh()} aria-label="Refresh suggested words">↻ Refresh</button>
        </div>
      </div>
      <div className="suggested-words" aria-label={`${level} suggested words`}>
        {words.map((word) => (
          <button type="button" key={word} onClick={() => onAdd(word)}>+ {word}</button>
        ))}
      </div>
      <small className="discovery-note">Singapore level bands are approximate starter guidance.</small>
    </section>
  )
}
