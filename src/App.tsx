import { useMemo, useRef, useState } from 'react'
import { CharacterInput } from './components/CharacterInput'
import { CharacterList } from './components/CharacterList'
import { Controls } from './components/Controls'
import { QuizControls } from './components/QuizControls'
import { HistoryPanel } from './components/HistoryPanel'
import { PronunciationPanel } from './components/PronunciationPanel'
import { SavedWordSets } from './components/SavedWordSets'
import { SectionMenu } from './components/SectionMenu'
import { StrokeAnimator, type StrokeAnimatorHandle } from './components/StrokeAnimator'
import { useHistory } from './hooks/useHistory'
import { useSavedWordSets } from './hooks/useSavedWordSets'
import { useSpeech } from './hooks/useSpeech'
import type { PlaybackState, PracticeMode, SavedWordSet, SpeechSpeed, Speed } from './types'
import { extractChineseCharacters } from './utils/characters'
import { getPinyin } from './utils/pinyin'

const EXAMPLE = '农场住着一群绵羊'

function App() {
  const [input, setInput] = useState(EXAMPLE)
  const [characters, setCharacters] = useState(() => extractChineseCharacters(EXAMPLE))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [mode, setMode] = useState<PracticeMode>('watch')
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [pinyinOverride, setPinyinOverride] = useState<string | undefined>()
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>('normal')
  const [speechSelection, setSpeechSelection] = useState<number[]>([0])
  const animatorRef = useRef<StrokeAnimatorHandle>(null)
  const runIdRef = useRef(0)
  const savedWordSets = useSavedWordSets()
  const history = useHistory()
  const speech = useSpeech()

  const chineseText = characters.join('')
  const autoPinyin = useMemo(() => getPinyin(chineseText), [chineseText])
  const displayedPinyin = pinyinOverride ?? autoPinyin
  const currentCharacter = characters[currentIndex]
  const currentCharacterPinyin = useMemo(() => getPinyin(currentCharacter ?? ''), [currentCharacter])

  const isPlaying = playbackState === 'playing' || isPlayingAll

  function stopPlayback() {
    runIdRef.current += 1
    setIsPlayingAll(false)
    animatorRef.current?.reset()
  }

  function parseText(text: string, manualPinyin?: string) {
    stopPlayback()
    const parsed = extractChineseCharacters(text)
    setCharacters(parsed)
    setCurrentIndex(0)
    setSpeechSelection(parsed.length ? [0] : [])
    setPinyinOverride(manualPinyin)
    setInputMessage(parsed.length ? '' : 'No Chinese characters found. Please try again.')
    if (parsed.length) history.record(parsed.join(''))
  }

  function parseInput() {
    parseText(input)
  }

  function loadText(text: string, manualPinyin?: string) {
    setInput(text)
    parseText(text, manualPinyin)
  }

  function loadSavedSet(set: SavedWordSet) {
    loadText(set.text, set.pinyin)
  }

  function selectCharacter(index: number) {
    stopPlayback()
    setCurrentIndex(index)
  }

  function toggleSpeechSelection(index: number) {
    setSpeechSelection((selected) => selected.includes(index)
      ? selected.filter((item) => item !== index)
      : [...selected, index].sort((a, b) => a - b))
  }

  async function playCurrent() {
    history.record(chineseText)
    await animatorRef.current?.play()
  }

  async function playAll() {
    if (!characters.length) return
    history.record(chineseText)
    stopPlayback()
    const runId = runIdRef.current
    setIsPlayingAll(true)

    for (let index = 0; index < characters.length; index += 1) {
      if (runId !== runIdRef.current) break
      setCurrentIndex(index)
      // Let React mount and load the new writer before asking it to play.
      await new Promise((resolve) => window.setTimeout(resolve, 650))
      if (runId !== runIdRef.current) break
      await animatorRef.current?.play()
      if (runId !== runIdRef.current) break
      await new Promise((resolve) => window.setTimeout(resolve, 300))
    }

    if (runId === runIdRef.current) setIsPlayingAll(false)
  }

  return (
    <main>
      <SectionMenu />
      <header className="hero">
        <div className="brand-mark" aria-hidden="true">永</div>
        <div>
          <p className="eyebrow">STROKE BY STROKE</p>
          <h1>Hanzi Steps</h1>
          <p>Learn to write Chinese characters, one gentle stroke at a time.</p>
        </div>
      </header>

      <CharacterInput value={input} onChange={setInput} onSubmit={parseInput} onImport={loadText} />
      {inputMessage && <p className="input-error" role="alert">{inputMessage}</p>}

      <section id="practice" className="practice-card" aria-labelledby="practice-heading">
        <div className="practice-heading">
          <div>
            <p className="eyebrow">STEP 2</p>
            <h2 id="practice-heading">{mode === 'watch' ? 'Watch and follow along' : 'Trace it yourself'}</h2>
          </div>
          {characters.length > 0 && (
            <span className="counter">Character {currentIndex + 1} of {characters.length}</span>
          )}
        </div>

        <div className="mode-switch" role="tablist" aria-label="Practice mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'watch'}
            className={mode === 'watch' ? 'active' : ''}
            onClick={() => { stopPlayback(); setMode('watch') }}
          >▶ Watch mode</button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'quiz'}
            className={mode === 'quiz' ? 'active' : ''}
            onClick={() => { stopPlayback(); setMode('quiz') }}
          >✎ Quiz mode</button>
        </div>

        {characters.length ? (
          <>
            <StrokeAnimator
              ref={animatorRef}
              character={characters[currentIndex]}
              speed={speed}
              mode={mode}
              onStateChange={setPlaybackState}
            />
            <CharacterList characters={characters} currentIndex={currentIndex} onSelect={selectCharacter} />
            {mode === 'watch' ? <Controls
              currentIndex={currentIndex}
              count={characters.length}
              isPlaying={isPlaying}
              isPlayingAll={isPlayingAll}
              speed={speed}
              onPrevious={() => selectCharacter(currentIndex - 1)}
              onNext={() => selectCharacter(currentIndex + 1)}
              onPlay={playCurrent}
              onPlayAll={playAll}
              onStop={stopPlayback}
              onSpeedChange={(nextSpeed) => {
                stopPlayback()
                setSpeed(nextSpeed)
              }}
            /> : <QuizControls
              currentIndex={currentIndex}
              count={characters.length}
              isLoading={playbackState === 'loading' || playbackState === 'unsupported'}
              onPrevious={() => selectCharacter(currentIndex - 1)}
              onNext={() => selectCharacter(currentIndex + 1)}
              onStart={() => { void animatorRef.current?.startQuiz() }}
              onReset={() => { void animatorRef.current?.resetQuiz() }}
            />}
          </>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">✎</span>
            <p>Your characters will appear here.</p>
          </div>
        )}
      </section>

      <PronunciationPanel
        text={chineseText}
        pinyin={displayedPinyin}
        autoPinyin={autoPinyin}
        currentCharacter={currentCharacter}
        currentCharacterPinyin={currentCharacterPinyin}
        characters={characters}
        currentIndex={currentIndex}
        selectedIndices={speechSelection}
        speechSpeed={speechSpeed}
        speechMessage={speech.message}
        voices={speech.voices}
        selectedVoiceURI={speech.selectedVoiceURI}
        onPinyinChange={setPinyinOverride}
        onUseAutomatic={() => setPinyinOverride(undefined)}
        onCurrentIndexChange={selectCharacter}
        onToggleSelectedIndex={toggleSpeechSelection}
        onSpeechSpeedChange={setSpeechSpeed}
        onVoiceChange={speech.setSelectedVoiceURI}
        onSpeakCharacter={() => speech.speak(currentCharacter ?? '', speechSpeed)}
        onSpeakSelection={() => speech.speak(speechSelection.map((index) => characters[index]).join(''), speechSpeed)}
        onSpeakText={() => speech.speak(chineseText, speechSpeed)}
      />

      <SavedWordSets
        currentText={input}
        currentPinyin={pinyinOverride}
        sets={savedWordSets.sets}
        storageError={savedWordSets.storageError}
        onSave={savedWordSets.save}
        onLoad={loadSavedSet}
        onDelete={savedWordSets.remove}
      />

      <HistoryPanel items={history.items} onLoad={loadText} onClear={history.clear} />

      <footer>Made for curious little writers.</footer>
    </main>
  )
}

export default App
