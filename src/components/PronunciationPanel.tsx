interface PronunciationPanelProps {
  text: string
  pinyin: string
  autoPinyin: string
  currentCharacter: string | undefined
  currentCharacterPinyin: string
  speechMessage: string
  onPinyinChange: (value: string) => void
  onUseAutomatic: () => void
  onSpeakCharacter: () => void
  onSpeakText: () => void
}

export function PronunciationPanel(props: PronunciationPanelProps) {
  return (
    <section className="pronunciation-card" aria-labelledby="pronunciation-heading">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">LISTEN & SAY</p>
          <h2 id="pronunciation-heading">Pronunciation</h2>
        </div>
        <span className="local-badge">普通话 · zh-CN</span>
      </div>

      <div className="pronunciation-text">
        <strong>{props.text || '—'}</strong>
        <span>{props.pinyin || 'Pinyin will appear here'}</span>
      </div>

      <label className="pinyin-editor">
        <span>Sentence pinyin <small>— editable for words with different pronunciations</small></span>
        <input value={props.pinyin} onChange={(event) => props.onPinyinChange(event.target.value)} aria-label="Editable sentence pinyin" />
      </label>
      {props.pinyin !== props.autoPinyin && (
        <button className="text-button" type="button" onClick={props.onUseAutomatic}>Use automatic pinyin</button>
      )}

      <div className="current-pronunciation">
        <span>Current character</span>
        <strong>{props.currentCharacter ?? '—'}</strong>
        <span>{props.currentCharacterPinyin || '—'}</span>
      </div>

      <div className="speech-actions">
        <button type="button" onClick={props.onSpeakCharacter} disabled={!props.currentCharacter}>🔊 Speak current character</button>
        <button className="primary" type="button" onClick={props.onSpeakText} disabled={!props.text}>🔊 Speak word / sentence</button>
      </div>
      {props.speechMessage && <p className="inline-message" role="status">{props.speechMessage}</p>}
    </section>
  )
}
