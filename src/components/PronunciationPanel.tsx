import type { SpeechSpeed } from '../types'

interface PronunciationPanelProps {
  text: string
  pinyin: string
  autoPinyin: string
  currentCharacter: string | undefined
  currentCharacterPinyin: string
  characters: string[]
  currentIndex: number
  selectedIndices: number[]
  speechSpeed: SpeechSpeed
  speechMessage: string
  onPinyinChange: (value: string) => void
  onUseAutomatic: () => void
  onSpeakCharacter: () => void
  onSpeakText: () => void
  onCurrentIndexChange: (index: number) => void
  onToggleSelectedIndex: (index: number) => void
  onSpeechSpeedChange: (speed: SpeechSpeed) => void
  onSpeakSelection: () => void
}

export function PronunciationPanel(props: PronunciationPanelProps) {
  return (
    <section id="pronunciation" className="pronunciation-card" aria-labelledby="pronunciation-heading">
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
        <label htmlFor="current-character">Current character</label>
        <select
          id="current-character"
          value={props.currentIndex}
          onChange={(event) => props.onCurrentIndexChange(Number(event.target.value))}
        >
          {props.characters.map((character, index) => (
            <option value={index} key={`${character}-${index}`}>{index + 1}. {character}</option>
          ))}
        </select>
        <span>{props.currentCharacterPinyin || '—'}</span>
      </div>

      <fieldset className="speech-selection">
        <legend>Select one or more characters to speak</legend>
        <div>
          {props.characters.map((character, index) => (
            <button
              type="button"
              className={props.selectedIndices.includes(index) ? 'selected' : ''}
              aria-pressed={props.selectedIndices.includes(index)}
              onClick={() => props.onToggleSelectedIndex(index)}
              key={`${character}-${index}`}
            >{character}</button>
          ))}
        </div>
      </fieldset>

      <label className="speech-speed">
        <span>Speech speed</span>
        <select value={props.speechSpeed} onChange={(event) => props.onSpeechSpeedChange(event.target.value as SpeechSpeed)}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </label>

      <div className="speech-actions">
        <button type="button" onClick={props.onSpeakCharacter} disabled={!props.currentCharacter}>🔊 Speak current character</button>
        <button type="button" onClick={props.onSpeakSelection} disabled={!props.selectedIndices.length}>🔊 Speak selected</button>
        <button className="primary" type="button" onClick={props.onSpeakText} disabled={!props.text}>🔊 Speak word / sentence</button>
      </div>
      {props.speechMessage && <p className="inline-message" role="status">{props.speechMessage}</p>}
    </section>
  )
}
