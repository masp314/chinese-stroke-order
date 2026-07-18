import { useCallback, useEffect, useRef, useState } from 'react'
import type { WorksheetItem, WorksheetOptions } from '../types/worksheet'
import { createWorksheetItems, splitInputToWordList } from '../utils/worksheetItems'
import { generateWorksheetPdf, type PdfResult } from '../utils/worksheetPdf'

interface WorksheetPanelProps {
  currentInput: string
  characters: string[]
}

export function WorksheetPanel({ currentInput, characters }: WorksheetPanelProps) {
  const [items, setItems] = useState<WorksheetItem[]>([])
  const [options, setOptions] = useState<WorksheetOptions>({
    level: 'K2',
    includeIllustrations: false,
    includeMiniTest: true,
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [pdfResult, setPdfResult] = useState<PdfResult | null>(null)
  const prevBlobUrl = useRef<string | null>(null)

  const loadItems = useCallback(async () => {
    if (characters.length === 0) return
    setLoading(true)
    setPdfResult(null)
    try {
      const wordList = splitInputToWordList(currentInput)
      const newItems = await createWorksheetItems(
        wordList.length > 0 ? wordList : [characters.join('')],
      )
      setItems(newItems)
    } finally {
      setLoading(false)
    }
  }, [currentInput, characters])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
    }
  }, [])

  function updateItem(id: string, field: keyof WorksheetItem, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
    setPdfResult(null)
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setPdfResult(null)
  }

  async function handleGenerate() {
    if (items.length === 0) return
    setGenerating(true)
    try {
      await new Promise((r) => setTimeout(r, 50))
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
      const result = generateWorksheetPdf(items, options)
      prevBlobUrl.current = result.blobUrl
      setPdfResult(result)
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!pdfResult) return
    const a = document.createElement('a')
    a.href = pdfResult.blobUrl
    a.download = pdfResult.filename
    a.click()
  }

  if (characters.length === 0) return null

  return (
    <section id="worksheet" className="practice-card" aria-labelledby="worksheet-heading">
      <div className="practice-heading">
        <div>
          <p className="eyebrow">PRINTABLE</p>
          <h2 id="worksheet-heading">Writing Worksheet</h2>
        </div>
      </div>

      <p className="worksheet-desc">
        Generate a printable PDF worksheet for handwriting practice.
        Review and edit the items below before generating.
      </p>

      {loading ? (
        <p className="worksheet-loading">Loading dictionary...</p>
      ) : (
        <>
          <div className="worksheet-items">
            {items.map((item) => (
              <div key={item.id} className="worksheet-item">
                <div className="worksheet-item-header">
                  <span className="worksheet-item-text">{item.text}</span>
                  <button
                    type="button"
                    className="worksheet-item-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.text}`}
                  >✕</button>
                </div>
                <div className="worksheet-item-fields">
                  <label className="worksheet-field">
                    <span className="worksheet-field-label">Pinyin</span>
                    <input
                      type="text"
                      value={item.pinyin}
                      onChange={(e) => updateItem(item.id, 'pinyin', e.target.value)}
                    />
                  </label>
                  <label className="worksheet-field">
                    <span className="worksheet-field-label">Meaning</span>
                    <input
                      type="text"
                      value={item.meaning}
                      placeholder="Enter English meaning"
                      onChange={(e) => updateItem(item.id, 'meaning', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {items.some((i) => !i.meaning) && (
            <p className="worksheet-warning">
              Some items have no meaning. You can still generate the PDF, but adding meanings is recommended.
            </p>
          )}

          <div className="worksheet-options">
            <label className="worksheet-option">
              <span>Level</span>
              <select
                value={options.level}
                onChange={(e) => setOptions({ ...options, level: e.target.value as 'K2' | 'P1' })}
              >
                <option value="K2">K2</option>
                <option value="P1">P1</option>
              </select>
            </label>
            <label className="worksheet-option">
              <input
                type="checkbox"
                checked={options.includeMiniTest}
                onChange={(e) => setOptions({ ...options, includeMiniTest: e.target.checked })}
              />
              <span>Include mini test</span>
            </label>
          </div>

          <div className="worksheet-actions">
            <button
              type="button"
              className="btn primary"
              disabled={items.length === 0 || generating}
              onClick={() => void handleGenerate()}
            >
              {generating ? 'Generating...' : pdfResult ? 'Regenerate PDF' : 'Generate PDF'}
            </button>

            {pdfResult && (
              <div className="worksheet-result">
                <button type="button" className="btn" onClick={handleDownload}>
                  Download PDF
                </button>
                <a
                  href={pdfResult.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  Preview in new tab
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
