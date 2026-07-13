import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const CHINESE_CHARACTER = /\p{Unified_Ideograph}/u

interface OcrProgressEvent {
  status: string
  progress?: number
}

interface PdfTextItem {
  str: string
  hasEOL?: boolean
}

export interface ExtractionResult {
  text: string
  pageCount?: number
  processedPages?: number
  usedOcr: boolean
}

export type ExtractionProgress = (message: string, progress?: number) => void

export function hasChineseText(text: string) {
  return CHINESE_CHARACTER.test(text)
}

export function cleanExtractedText(text: string) {
  return text
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map((line) => line
      .replace(/^\s*(?:\(?\d+[.)、．:：）-]\s*|第\s*\d+\s*[题課课]\s*)/u, '')
      .replace(/[\t ]{2,}/g, ' ')
      .trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function recognizeSources(sources: Array<File | HTMLCanvasElement>, onProgress: ExtractionProgress) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('chi_sim', 1, {
    logger: (event: OcrProgressEvent) => {
      if (typeof event.progress === 'number') {
        onProgress(`OCR: ${event.status}`, event.progress)
      } else {
        onProgress(`OCR: ${event.status}`)
      }
    },
  })

  try {
    const results: string[] = []
    for (let index = 0; index < sources.length; index += 1) {
      onProgress(`Recognising page ${index + 1} of ${sources.length}…`, index / sources.length)
      const result = await worker.recognize(sources[index])
      results.push(result.data.text)
    }
    return results.join('\n\n')
  } finally {
    await worker.terminate()
  }
}

export async function extractFromImage(file: File, onProgress: ExtractionProgress): Promise<ExtractionResult> {
  onProgress('Loading Chinese OCR…', 0)
  const text = await recognizeSources([file], onProgress)
  return { text: cleanExtractedText(text), usedOcr: true }
}

export async function extractFromPdf(file: File, onProgress: ExtractionProgress): Promise<ExtractionResult> {
  onProgress('Opening PDF…', 0)
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const processedPages = Math.min(pdf.numPages, 3)
  const pageTexts: string[] = []

  for (let pageNumber = 1; pageNumber <= processedPages; pageNumber += 1) {
    onProgress(`Reading PDF text: page ${pageNumber} of ${processedPages}…`, pageNumber / processedPages)
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    pageTexts.push(content.items
      .map((item) => {
        if (!('str' in item)) return ''
        const textItem = item as PdfTextItem
        return `${textItem.str}${textItem.hasEOL ? '\n' : ' '}`
      })
      .join(''))
  }

  const embeddedText = cleanExtractedText(pageTexts.join('\n'))
  if (hasChineseText(embeddedText)) {
    return { text: embeddedText, pageCount: pdf.numPages, processedPages, usedOcr: false }
  }

  onProgress('No useful embedded Chinese text found. Preparing page images for OCR…', 0)
  const canvases: HTMLCanvasElement[] = []
  for (let pageNumber = 1; pageNumber <= processedPages; pageNumber += 1) {
    onProgress(`Rendering page ${pageNumber} of ${processedPages}…`, pageNumber / processedPages)
    const page = await pdf.getPage(pageNumber)
    const initialViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(2, 2200 / Math.max(initialViewport.width, initialViewport.height))
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas is not available in this browser.')
    await page.render({ canvas, canvasContext: context, viewport }).promise
    canvases.push(canvas)
  }

  const ocrText = await recognizeSources(canvases, onProgress)
  return {
    text: cleanExtractedText(ocrText),
    pageCount: pdf.numPages,
    processedPages,
    usedOcr: true,
  }
}
