interface QuizControlsProps {
  currentIndex: number
  count: number
  isLoading: boolean
  onPrevious: () => void
  onNext: () => void
  onStart: () => void
  onReset: () => void
}

export function QuizControls({ currentIndex, count, isLoading, onPrevious, onNext, onStart, onReset }: QuizControlsProps) {
  return (
    <div className="quiz-controls">
      <div className="control-group navigation" aria-label="Quiz character navigation">
        <button type="button" onClick={onPrevious} disabled={currentIndex === 0}>← Previous</button>
        <button type="button" onClick={onNext} disabled={currentIndex === count - 1}>Next →</button>
      </div>
      <div className="control-group">
        <button className="primary" type="button" onClick={onStart} disabled={isLoading}>✎ Start quiz</button>
        <button type="button" onClick={onReset} disabled={isLoading}>↻ Reset quiz</button>
      </div>
    </div>
  )
}
