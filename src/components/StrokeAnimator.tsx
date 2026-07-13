import HanziWriter from 'hanzi-writer'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { loadCharacterData } from '../services/characterData'
import type { PlaybackState, PracticeMode, Speed } from '../types'

const SPEEDS: Record<Speed, { strokeAnimationSpeed: number; delayBetweenStrokes: number }> = {
  slow: { strokeAnimationSpeed: 0.55, delayBetweenStrokes: 650 },
  normal: { strokeAnimationSpeed: 1, delayBetweenStrokes: 350 },
  fast: { strokeAnimationSpeed: 1.8, delayBetweenStrokes: 140 },
}

export interface StrokeAnimatorHandle {
  play: () => Promise<boolean>
  reset: () => void
  startQuiz: () => Promise<boolean>
  resetQuiz: () => Promise<boolean>
}

interface StrokeAnimatorProps {
  character: string | undefined
  speed: Speed
  mode: PracticeMode
  onStateChange: (state: PlaybackState) => void
}

export const StrokeAnimator = forwardRef<StrokeAnimatorHandle, StrokeAnimatorProps>(
  function StrokeAnimator({ character, speed, mode, onStateChange }, ref) {
    const targetRef = useRef<HTMLDivElement>(null)
    const writerRef = useRef<HanziWriter | null>(null)
    const generationRef = useRef(0)
    const [state, setState] = useState<PlaybackState>('idle')

    function updateState(nextState: PlaybackState) {
      setState(nextState)
      onStateChange(nextState)
    }

    useEffect(() => {
      generationRef.current += 1
      writerRef.current = null
      if (!targetRef.current) return
      targetRef.current.replaceChildren()

      if (!character) {
        updateState('idle')
        return
      }

      const generation = generationRef.current
      updateState('loading')

      const writer = HanziWriter.create(targetRef.current, character, {
        width: 360,
        height: 360,
        padding: 28,
        showOutline: true,
        showCharacter: mode === 'watch',
        strokeColor: '#334155',
        outlineColor: '#d8e1e7',
        radicalColor: '#ef7f6d',
        drawingColor: '#ef7f6d',
        ...SPEEDS[speed],
        charDataLoader: (char, onComplete, onError) => {
          loadCharacterData(char)
            .then(onComplete)
            .catch((error) => onError(error instanceof Error ? error : new Error(String(error))))
        },
        onLoadCharDataError: () => {
          if (generation === generationRef.current) updateState('unsupported')
        },
        onLoadCharDataSuccess: () => {
          if (generation === generationRef.current) updateState('idle')
        },
      })
      writerRef.current = writer

      return () => {
        generationRef.current += 1
        writerRef.current = null
      }
      // Recreate the writer so new timing settings apply consistently.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [character, speed, mode])

    useImperativeHandle(ref, () => ({
      play: async () => {
        const writer = writerRef.current
        if (!writer || state === 'unsupported' || state === 'loading') return false
        const generation = generationRef.current
        updateState('playing')
        try {
          await writer.hideCharacter({ duration: 120 })
          if (generation !== generationRef.current) return false
          await writer.animateCharacter()
          if (generation !== generationRef.current) return false
          updateState('idle')
          return true
        } catch {
          if (generation === generationRef.current) updateState('unsupported')
          return false
        }
      },
      reset: () => {
        generationRef.current += 1
        const writer = writerRef.current
        if (writer) {
          void writer.showCharacter({ duration: 0 })
          writerRef.current = writer
        }
        updateState(state === 'unsupported' ? 'unsupported' : 'idle')
      },
      startQuiz: async () => {
        const writer = writerRef.current
        if (!writer || state === 'unsupported' || state === 'loading') return false
        const generation = generationRef.current
        writer.cancelQuiz()
        updateState('quizzing')
        try {
          await writer.quiz({
            showHintAfterMisses: 2,
            highlightOnComplete: true,
            onComplete: () => {
              if (generation === generationRef.current) updateState('idle')
            },
          })
          return generation === generationRef.current
        } catch {
          if (generation === generationRef.current) updateState('unsupported')
          return false
        }
      },
      resetQuiz: async () => {
        const writer = writerRef.current
        if (!writer || state === 'unsupported' || state === 'loading') return false
        writer.cancelQuiz()
        await writer.showCharacter({ duration: 0 })
        const generation = generationRef.current
        updateState('quizzing')
        try {
          await writer.quiz({
            showHintAfterMisses: 2,
            highlightOnComplete: true,
            onComplete: () => {
              if (generation === generationRef.current) updateState('idle')
            },
          })
          return generation === generationRef.current
        } catch {
          if (generation === generationRef.current) updateState('unsupported')
          return false
        }
      },
    }))

    return (
      <div className="animator-wrap">
        <div className="writing-grid" aria-label={character ? `Stroke order for ${character}` : 'No character selected'}>
          <div ref={targetRef} className="writer-target" />
        </div>
        <div className="animator-status" role="status" aria-live="polite">
          {state === 'loading' && 'Loading stroke data…'}
          {state === 'playing' && 'Watch the strokes carefully!'}
          {state === 'quizzing' && 'Trace the strokes in order. You can do it!'}
          {state === 'unsupported' && 'Stroke data not found for this character.'}
          {state === 'idle' && character && (mode === 'quiz' ? 'Quiz ready — tap Start quiz' : 'Ready to practise')}
        </div>
      </div>
    )
  },
)
