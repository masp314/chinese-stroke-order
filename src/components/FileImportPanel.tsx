import { useRef, useState } from 'react'
import { extractFromImage, extractFromPdf, hasChineseText } from '../utils/importText'

interface FileImportPanelProps {
  onUseText: (text: string) => void
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function FileImportPanel({ onUseText }: FileImportPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('')
  const [warning, setWarning] = useState('')
  const [progress, setProgress] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function importFile(file: File) {
    setBusy(true)
    setFileName(file.name)
    setExtractedText('')
    setWarning('')
    setProgress(0)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const isPdf = file.type === 'application/pdf' || extension === 'pdf'
      const isImage = IMAGE_TYPES.has(file.type) || ['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '')
      if (!isPdf && !isImage) throw new Error('Please choose a PNG, JPG, JPEG, WebP, or PDF file.')

      const result = isPdf
        ? await extractFromPdf(file, (message, value) => { setStatus(message); setProgress(value) })
        : await extractFromImage(file, (message, value) => { setStatus(message); setProgress(value) })

      setExtractedText(result.text)
      setProgress(1)
      setStatus(result.usedOcr ? 'OCR complete. Please review and edit the text.' : 'PDF text extracted. Please review and edit it.')

      const messages: string[] = []
      if (result.pageCount && result.pageCount > 3) messages.push(`This PDF has ${result.pageCount} pages. Only the first ${result.processedPages} were processed.`)
      if (!hasChineseText(result.text)) messages.push('No Chinese text found. Please edit manually or try another image.')
      setWarning(messages.join(' '))
    } catch (error) {
      const unsupported = error instanceof Error && error.message.startsWith('Please choose')
      setStatus(unsupported
        ? error.message
        : 'Text extraction failed. Please try another file or enter the text manually.')
      setWarning(error instanceof Error && !unsupported ? error.message : '')
      setProgress(undefined)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section id="file-import" className="file-import-card" aria-labelledby="file-import-heading">
      <button
        type="button"
        className="file-import-toggle"
        aria-expanded={expanded}
        aria-controls="file-import-content"
        onClick={() => setExpanded((value) => !value)}
      >
        <span><span className="eyebrow">ADVANCED</span><strong id="file-import-heading">Import from Image / PDF</strong></span>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div id="file-import-content" className="file-import-content">
          <p>Extract possible Chinese text on this device, then review it before adding it to your practice.</p>
          <label className={`file-picker ${busy ? 'disabled' : ''}`}>
            <span>{busy ? 'Extracting text…' : 'Choose image or PDF'}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.pdf,application/pdf"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importFile(file)
              }}
            />
          </label>
          {fileName && <p className="import-file-name">Selected: {fileName}</p>}
          {progress !== undefined && <progress value={progress} max={1} aria-label="Extraction progress" />}
          {status && <p className="inline-message" role="status">{status}</p>}
          {warning && <p className="inline-message error" role="alert">{warning}</p>}

          <label className="extracted-text-editor">
            <span>Extracted text — review and edit before using</span>
            <textarea
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              rows={7}
              placeholder="Extracted text will appear here. You can also type corrections manually."
            />
          </label>
          <button
            className="primary use-import-button"
            type="button"
            disabled={busy || !extractedText.trim()}
            onClick={() => onUseText(extractedText)}
          >Use this text &amp; show characters</button>
          <p className="import-privacy">Images and PDFs are not uploaded to this app's server. Chinese OCR language data may be downloaded on first use.</p>
        </div>
      )}
    </section>
  )
}
