import type { SpeechSpeed } from '../types'
import { getPinyin } from '../utils/pinyin'
import { WordDefinitionPanel } from './WordDefinitionPanel'

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
  voices: Array<{ voiceURI: string; name: string; lang: string }>
  selectedVoiceURI: string
  aiProxyUrl: string
  onPinyinChange: (value: string) => void
  onUseAutomatic: () => void
  onSpeakCharacter: () => void
  onSpeakText: () => void
  onCurrentIndexChange: (index: number) => void
  onToggleSelectedIndex: (index: number) => void
  onSpeechSpeedChange: (speed: SpeechSpeed) => void
  onSpeakSelection: () => void
  onVoiceChange: (voiceURI: string) => void
}

export function PronunciationPanel(props: PronunciationPanelProps) {
  const selectedVoice = props.voices.find((voice) => voice.voiceURI === props.selectedVoiceURI)
  const normalizeLanguage = (language: string) => language.toLowerCase().replaceAll('_', '-')
  const hongKongVoices = props.voices.filter((voice) => {
    const language = normalizeLanguage(voice.lang)
    return language === 'zh-hk' || language.startsWith('zh-hk-')
      || language === 'yue-hk' || language.startsWith('yue-hk-')
      || language.includes('-hant-hk')
  })
  const mainlandVoices = props.voices.filter((voice) => !hongKongVoices.includes(voice))

  return (
    <section id="pronunciation" className="pronunciation-card" aria-labelledby="pronunciation-heading">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">LISTEN & SAY</p>
          <h2 id="pronunciation-heading">Pronunciation</h2>
        </div>
        <span className="local-badge">{selectedVoice ? selectedVoice.lang : 'System Mandarin · zh-CN'}</span>
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

      <div className="listen-actions">
        <section className="listen-action sentence-listen" aria-labelledby="sentence-listen-heading">
          <div className="listen-action-heading">
            <span className="action-number">1</span>
            <div><h3 id="sentence-listen-heading">Listen to the whole sentence</h3><p>Choose a Mandarin voice and speed.</p></div>
          </div>
          <div className="sentence-listen-controls">
            <label>
              <span>Chinese voice</span>
              <select value={props.selectedVoiceURI} onChange={(event) => props.onVoiceChange(event.target.value)}>
                {!props.voices.length && <option value="">System Mandarin · zh-CN</option>}
                {!!mainlandVoices.length && (
                  <optgroup label="Mainland Mandarin (default)">
                    {mainlandVoices.map((voice) => (
                      <option value={voice.voiceURI} key={voice.voiceURI}>{voice.name} · {voice.lang}</option>
                    ))}
                  </optgroup>
                )}
                {!!hongKongVoices.length && (
                  <optgroup label="Hong Kong (manual selection)">
                    {hongKongVoices.map((voice) => (
                      <option value={voice.voiceURI} key={voice.voiceURI}>{voice.name} · {voice.lang}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label>
              <span>Speed</span>
              <select value={props.speechSpeed} onChange={(event) => props.onSpeechSpeedChange(event.target.value as SpeechSpeed)}>
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <button type="button" onClick={props.onSpeakText} disabled={!props.text}>🔊 Speak word / sentence</button>
          </div>
        </section>

        <section className="listen-action single-listen" aria-labelledby="single-listen-heading">
          <div className="listen-action-heading">
            <span className="action-number">2</span>
            <div><h3 id="single-listen-heading">Listen to one character</h3><p>Choose one character, then play it.</p></div>
          </div>
          <div className="single-listen-controls">
            <label>
              <span>Character</span>
              <select value={props.currentIndex} onChange={(event) => props.onCurrentIndexChange(Number(event.target.value))}>
                {props.characters.map((character, index) => (
                  <option value={index} key={`${character}-${index}`}>{index + 1}. {character} · {getPinyin(character)}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={props.onSpeakCharacter} disabled={!props.currentCharacter}>🔊 Speak this character</button>
          </div>
          <WordDefinitionPanel character={props.currentCharacter} aiProxyUrl={props.aiProxyUrl} />
        </section>

        <section className="listen-action selected-listen" aria-labelledby="selected-listen-heading">
          <div className="listen-action-heading">
            <span className="action-number">3</span>
            <div><h3 id="selected-listen-heading">Listen to selected characters</h3><p>Tap one or more characters, then play them.</p></div>
          </div>
          <div className="selection-row">
            <div className="speech-selection">
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
            <button className="selected-speak-button" type="button" onClick={props.onSpeakSelection} disabled={!props.selectedIndices.length}>🔊 Speak selected</button>
          </div>
        </section>

      </div>
      {props.speechMessage && <p className="inline-message" role="status">{props.speechMessage}</p>}
    </section>
  )
}
