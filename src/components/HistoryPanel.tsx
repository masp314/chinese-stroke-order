import type { HistoryItem } from '../types'

interface HistoryPanelProps {
  items: HistoryItem[]
  onLoad: (text: string) => void
  onClear: () => void
}

export function HistoryPanel({ items, onLoad, onClear }: HistoryPanelProps) {
  return (
    <section className="history-card" aria-labelledby="history-heading">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">RECENT PRACTICE</p>
          <h2 id="history-heading">History</h2>
        </div>
        {items.length > 0 && <button className="text-button danger-button" type="button" onClick={onClear}>Clear history</button>}
      </div>
      {items.length ? (
        <div className="history-list">
          {items.map((item) => (
            <button type="button" onClick={() => onLoad(item.text)} key={item.text}>{item.text}</button>
          ))}
        </div>
      ) : <p className="no-saves">Words you load or play will appear here.</p>}
    </section>
  )
}
