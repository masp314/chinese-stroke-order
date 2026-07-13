import type { Speed } from '../types'

interface ControlsProps {
  currentIndex: number
  count: number
  isPlaying: boolean
  isPlayingAll: boolean
  speed: Speed
  onPrevious: () => void
  onNext: () => void
  onPlay: () => void
  onPlayAll: () => void
  onStop: () => void
  onSpeedChange: (speed: Speed) => void
}

export function Controls(props: ControlsProps) {
  const { currentIndex, count, isPlaying, isPlayingAll, speed } = props
  const disabled = count === 0

  return (
    <div className="controls">
      <div className="control-group navigation" aria-label="Character navigation">
        <button type="button" onClick={props.onPrevious} disabled={disabled || currentIndex === 0}>
          <span aria-hidden="true">←</span> Previous
        </button>
        <button type="button" onClick={props.onNext} disabled={disabled || currentIndex === count - 1}>
          Next <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="control-group playback" aria-label="Animation controls">
        <button className="primary" type="button" onClick={props.onPlay} disabled={disabled || isPlaying}>
          <span aria-hidden="true">▶</span> {isPlaying && !isPlayingAll ? 'Playing…' : 'Play / Replay'}
        </button>
        <button type="button" onClick={props.onPlayAll} disabled={disabled || isPlaying}>
          <span aria-hidden="true">▶▶</span> {isPlayingAll ? 'Playing all…' : 'Play all'}
        </button>
        <button type="button" onClick={props.onStop} disabled={!isPlaying}>
          <span aria-hidden="true">■</span> Stop & reset
        </button>
      </div>

      <label className="speed-control">
        <span>Speed</span>
        <select value={speed} onChange={(event) => props.onSpeedChange(event.target.value as Speed)}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </label>
    </div>
  )
}
