import { useRef, useState } from 'react'
import { CharacterInput } from './components/CharacterInput'
import { CharacterList } from './components/CharacterList'
import { Controls } from './components/Controls'
import { QuizControls } from './components/QuizControls'
import { SavedWordSets } from './components/SavedWordSets'
import { StrokeAnimator, type StrokeAnimatorHandle } from './components/StrokeAnimator'
import { useSavedWordSets } from './hooks/useSavedWordSets'
import type { PlaybackState, PracticeMode, Speed } from './types'
import { extractChineseCharacters } from './utils/characters'

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
  const animatorRef = useRef<StrokeAnimatorHandle>(null)
  const runIdRef = useRef(0)
  const savedWordSets = useSavedWordSets()

  const isPlaying = playbackState === 'playing' || isPlayingAll

  function stopPlayback() {
    runIdRef.current += 1
    setIsPlayingAll(false)
    animatorRef.current?.reset()
  }

  function parseText(text: string) {
    stopPlayback()
    const parsed = extractChineseCharacters(text)
    setCharacters(parsed)
    setCurrentIndex(0)
    setInputMessage(parsed.length ? '' : 'No Chinese characters found. Please try again.')
  }

  function parseInput() {
    parseText(input)
  }

  function loadText(text: string) {
    setInput(text)
    parseText(text)
  }

  function selectCharacter(index: number) {
    stopPlayback()
    setCurrentIndex(index)
  }

  async function playCurrent() {
    await animatorRef.current?.play()
  }

  async function playAll() {
    if (!characters.length) return
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

      <SavedWordSets
        currentText={input}
        sets={savedWordSets.sets}
        storageError={savedWordSets.storageError}
        onSave={savedWordSets.save}
        onLoad={loadText}
        onDelete={savedWordSets.remove}
      />

      <section className="practice-card" aria-labelledby="practice-heading">
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

      <footer>Made for curious little writers.</footer>
    </main>
  )
}

export default App
