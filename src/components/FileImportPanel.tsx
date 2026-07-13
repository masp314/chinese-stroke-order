import { useRef, useState } from 'react'
import { extractFromImage, extractFromPdf, hasChineseText, type ImageOcrMode } from '../utils/importText'
import { extractWithAi } from '../utils/aiExtract'

interface FileImportPanelProps {
  onUseText: (text: string) => void
  aiProxyUrl: string
  onOpenAiSettings: () => void
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

type ExtractionMethod = 'local' | 'ai'

export function FileImportPanel({ onUseText, aiProxyUrl, onOpenAiSettings }: FileImportPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('')
  const [warning, setWarning] = useState('')
  const [progress, setProgress] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const [imageMode, setImageMode] = useState<ImageOcrMode>('auto')
  const [previewUrl, setPreviewUrl] = useState('')
  const [method, setMethod] = useState<ExtractionMethod>('local')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedFileRef = useRef<File | null>(null)

  const aiConfigured = aiProxyUrl.length > 0

  async function runLocalOcr(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const isPdf = file.type === 'application/pdf' || extension === 'pdf'
    const isImage = IMAGE_TYPES.has(file.type) || ['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '')
    if (!isPdf && !isImage) throw new Error('Please choose a PNG, JPG, JPEG, WebP, or PDF file.')

    const result = isPdf
      ? await extractFromPdf(file, (message, value) => { setStatus(message); setProgress(value) })
      : await extractFromImage(file, imageMode, (message, value) => { setStatus(message); setProgress(value) })

    setExtractedText(result.text)
    setPreviewUrl(result.previewUrl ?? '')
    setProgress(1)
    setStatus(result.usedOcr
      ? `${result.ocrMode === 'phrase' ? 'Short-phrase' : 'Document'} OCR complete. Please review and edit the text.`
      : 'PDF text extracted. Please review and edit it.')

    const messages: string[] = []
    if (result.pageCount && result.pageCount > 3) messages.push(`This PDF has ${result.pageCount} pages. Only the first ${result.processedPages} were processed.`)
    if (!hasChineseText(result.text)) messages.push('No Chinese text found. Please edit manually or try another image.')
    setWarning(messages.join(' '))
  }

  async function runAiExtract(file: File) {
    const result = await extractWithAi(file, aiProxyUrl, (message) => {
      setStatus(message)
      setProgress(undefined)
    })
    setExtractedText(result.text)
    setPreviewUrl('')
    setProgress(1)
    setStatus('AI extraction complete. Please review and edit the text.')
    if (!hasChineseText(result.text)) {
      setWarning('No Chinese text found in AI result. Please edit manually or try another image.')
    }
  }

  async function importFile(file: File, extractionMethod: ExtractionMethod) {
    setBusy(true)
    setFileName(file.name)
    setExtractedText('')
    setWarning('')
    setPreviewUrl('')
    setProgress(0)

    try {
      if (extractionMethod === 'ai') {
        await runAiExtract(file)
      } else {
        await runLocalOcr(file)
      }
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

  function handleFileSelected(file: File) {
    selectedFileRef.current = file
    void importFile(file, method)
  }

  function retryWithMethod(newMethod: ExtractionMethod) {
    setMethod(newMethod)
    const file = selectedFileRef.current
    if (file) void importFile(file, newMethod)
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
          <p>Extract possible Chinese text, then review it before adding it to your practice.</p>

          <fieldset className="extraction-method" disabled={busy}>
            <legend>Extraction method</legend>
            <div className="method-options">
              <label className={`method-option ${method === 'local' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="extraction-method"
                  value="local"
                  checked={method === 'local'}
                  onChange={() => setMethod('local')}
                />
                <span className="method-label">Local OCR</span>
                <span className="method-desc">Free, runs on your device</span>
              </label>
              <label className={`method-option ${method === 'ai' ? 'selected' : ''} ${!aiConfigured ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="extraction-method"
                  value="ai"
                  checked={method === 'ai'}
                  disabled={!aiConfigured}
                  onChange={() => setMethod('ai')}
                />
                <span className="method-label">AI Extract</span>
                <span className="method-desc">{aiConfigured ? 'Higher accuracy via AI' : 'Needs setup'}</span>
              </label>
            </div>
            {!aiConfigured && (
              <button type="button" className="link-button ai-setup-link" onClick={onOpenAiSettings}>
                Set up AI extraction →
              </button>
            )}
          </fieldset>

          {method === 'local' && (
            <label className="ocr-mode-control">
              <span>Image type</span>
              <select value={imageMode} disabled={busy} onChange={(event) => setImageMode(event.target.value as ImageOcrMode)}>
                <option value="auto">Auto detect</option>
                <option value="phrase">Word / short phrase (1–10 characters)</option>
                <option value="worksheet">Worksheet / full page</option>
              </select>
              <small>For one character or a short word such as 农、农夫、又长又卷, select "Word / short phrase".</small>
            </label>
          )}

          <label className={`file-picker ${busy ? 'disabled' : ''}`}>
            <span>{busy ? 'Extracting text…' : 'Choose image or PDF'}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.pdf,application/pdf"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) handleFileSelected(file)
              }}
            />
          </label>
          {fileName && <p className="import-file-name">Selected: {fileName}</p>}
          {progress !== undefined && <progress value={progress} max={1} aria-label="Extraction progress" />}
          {status && <p className="inline-message" role="status">{status}</p>}
          {warning && <p className="inline-message error" role="alert">{warning}</p>}

          {fileName && !busy && selectedFileRef.current && (
            <div className="retry-methods">
              {method === 'local' && aiConfigured && (
                <button type="button" className="secondary" onClick={() => retryWithMethod('ai')}>
                  Retry with AI Extract
                </button>
              )}
              {method === 'ai' && (
                <button type="button" className="secondary" onClick={() => retryWithMethod('local')}>
                  Retry with Local OCR
                </button>
              )}
            </div>
          )}

          {previewUrl && (
            <figure className="ocr-preview">
              <figcaption>Image sent to OCR</figcaption>
              <img src={previewUrl} alt="Processed black-and-white OCR input" />
            </figure>
          )}

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
          <p className="import-privacy">
            {method === 'ai'
              ? 'Images are sent to your configured AI proxy for extraction. They are not stored.'
              : 'Images and PDFs are not uploaded to this app\'s server. Chinese OCR language data may be downloaded on first use.'}
          </p>
        </div>
      )}
    </section>
  )
}
