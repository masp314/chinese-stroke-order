import { useState } from 'react'
import type { SavedWordSet } from '../types'

interface SavedWordSetsProps {
  currentText: string
  sets: SavedWordSet[]
  storageError: string
  onSave: (title: string, text: string) => boolean
  onLoad: (text: string) => void
  onDelete: (id: string) => void
}

export function SavedWordSets({ currentText, sets, storageError, onSave, onLoad, onDelete }: SavedWordSetsProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  function saveCurrent() {
    if (!title.trim()) {
      setMessage('Please add a title first.')
      return
    }
    if (!currentText.trim()) {
      setMessage('Enter some Chinese words before saving.')
      return
    }
    if (onSave(title, currentText)) {
      setTitle('')
      setMessage('Saved on this device.')
    }
  }

  return (
    <section className="library-card" aria-labelledby="saved-heading">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">MY WORD SETS</p>
          <h2 id="saved-heading">Save for another practice</h2>
        </div>
        <span className="local-badge">On this device</span>
      </div>
      <div className="save-row">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') saveCurrent() }}
          maxLength={40}
          placeholder="Set title, e.g. Farm words"
          aria-label="Saved set title"
        />
        <button type="button" onClick={saveCurrent}>＋ Save current text</button>
      </div>
      {(message || storageError) && <p className={storageError ? 'inline-message error' : 'inline-message'} role="status">{storageError || message}</p>}
      {sets.length ? (
        <div className="saved-list">
          {sets.map((set) => (
            <article className="saved-item" key={set.id}>
              <div>
                <h3>{set.title}</h3>
                <p>{set.text}</p>
              </div>
              <div className="saved-actions">
                <button type="button" onClick={() => onLoad(set.text)}>Load</button>
                <button className="danger-button" type="button" onClick={() => onDelete(set.id)} aria-label={`Delete ${set.title}`}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="no-saves">No saved sets yet.</p>}
    </section>
  )
}
