import { useState } from 'react'

interface CharacterInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onImport: (value: string) => void
}

export function CharacterInput({ value, onChange, onSubmit, onImport }: CharacterInputProps) {
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  return (
    <section id="input" className="input-card" aria-labelledby="input-heading">
      <div>
        <p className="eyebrow">STEP 1</p>
        <h2 id="input-heading">What would you like to practise?</h2>
      </div>
      <div className="input-row">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') onSubmit()
          }}
          rows={2}
          maxLength={80}
          placeholder="Type Chinese here… 例如：农场住着一群绵羊"
          aria-label="Chinese text"
        />
        <button className="primary parse-button" type="button" onClick={onSubmit}>
          Show characters
        </button>
      </div>
      <p className="input-hint">Spaces, punctuation, English letters and numbers are ignored.</p>
      <button className="text-button" type="button" onClick={() => setShowImport((shown) => !shown)} aria-expanded={showImport}>
        {showImport ? 'Hide paste list' : 'Paste / import a word list'}
      </button>
      {showImport && (
        <div className="import-panel">
          <label htmlFor="import-list">Paste worksheet words or a numbered list</label>
          <textarea
            id="import-list"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={4}
            placeholder={'1. 农夫\n2. 羊毛\n3. 又长又卷'}
          />
          <button className="primary" type="button" onClick={() => {
            onImport(importText)
            setShowImport(false)
          }}>Extract Chinese characters</button>
        </div>
      )}
    </section>
  )
}
