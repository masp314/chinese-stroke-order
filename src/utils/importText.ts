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
  ocrMode?: Exclude<ImageOcrMode, 'auto'>
}

export type ExtractionProgress = (message: string, progress?: number) => void
export type ImageOcrMode = 'auto' | 'phrase' | 'worksheet'

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

async function createChineseWorker(onProgress: ExtractionProgress) {
  const { createWorker } = await import('tesseract.js')
  return createWorker('chi_sim', 1, {
    logger: (event: OcrProgressEvent) => {
      if (typeof event.progress === 'number') onProgress(`OCR: ${event.status}`, event.progress)
      else onProgress(`OCR: ${event.status}`)
    },
  })
}

async function recognizeSources(sources: Array<File | HTMLCanvasElement>, onProgress: ExtractionProgress) {
  const worker = await createChineseWorker(onProgress)

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

function getOtsuThreshold(histogram: number[], pixelCount: number) {
  let weightedTotal = 0
  for (let value = 0; value < 256; value += 1) weightedTotal += value * histogram[value]
  let backgroundWeight = 0
  let backgroundTotal = 0
  let bestVariance = -1
  let threshold = 160
  for (let value = 0; value < 256; value += 1) {
    backgroundWeight += histogram[value]
    if (!backgroundWeight) continue
    const foregroundWeight = pixelCount - backgroundWeight
    if (!foregroundWeight) break
    backgroundTotal += value * histogram[value]
    const backgroundMean = backgroundTotal / backgroundWeight
    const foregroundMean = (weightedTotal - backgroundTotal) / foregroundWeight
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2
    if (variance > bestVariance) {
      bestVariance = variance
      threshold = value
    }
  }
  return Math.min(185, Math.max(80, threshold))
}

async function prepareShortPhraseImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const maxSide = 1800
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = Math.max(1, Math.round(bitmap.width * scale))
  sourceCanvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) throw new Error('Canvas is not available in this browser.')
  sourceContext.fillStyle = 'white'
  sourceContext.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height)
  sourceContext.drawImage(bitmap, 0, 0, sourceCanvas.width, sourceCanvas.height)
  bitmap.close()

  const image = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  const histogram = Array.from({ length: 256 }, () => 0)
  for (let index = 0; index < image.data.length; index += 4) {
    const grey = Math.round(image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114)
    histogram[grey] += 1
  }
  const threshold = getOtsuThreshold(histogram, sourceCanvas.width * sourceCanvas.height)
  let left = sourceCanvas.width
  let top = sourceCanvas.height
  let right = 0
  let bottom = 0
  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const index = (y * sourceCanvas.width + x) * 4
      const grey = Math.round(image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114)
      const ink = grey < threshold
      const value = ink ? 0 : 255
      image.data[index] = value
      image.data[index + 1] = value
      image.data[index + 2] = value
      image.data[index + 3] = 255
      if (ink) {
        left = Math.min(left, x); right = Math.max(right, x)
        top = Math.min(top, y); bottom = Math.max(bottom, y)
      }
    }
  }
  sourceContext.putImageData(image, 0, 0)

  if (right <= left || bottom <= top) return sourceCanvas
  const inkWidth = right - left + 1
  const inkHeight = bottom - top + 1
  const padding = Math.round(Math.max(inkWidth, inkHeight) * .16)
  const cropLeft = Math.max(0, left - padding)
  const cropTop = Math.max(0, top - padding)
  const cropRight = Math.min(sourceCanvas.width, right + padding)
  const cropBottom = Math.min(sourceCanvas.height, bottom + padding)
  const cropWidth = cropRight - cropLeft
  const cropHeight = cropBottom - cropTop
  const target = document.createElement('canvas')
  target.width = 1024
  target.height = 1024
  const targetContext = target.getContext('2d', { alpha: false })
  if (!targetContext) throw new Error('Canvas is not available in this browser.')
  targetContext.fillStyle = 'white'
  targetContext.fillRect(0, 0, target.width, target.height)
  const targetScale = Math.min(820 / cropWidth, 820 / cropHeight)
  const width = cropWidth * targetScale
  const height = cropHeight * targetScale
  targetContext.imageSmoothingEnabled = false
  targetContext.drawImage(sourceCanvas, cropLeft, cropTop, cropWidth, cropHeight, (1024 - width) / 2, (1024 - height) / 2, width, height)
  return target
}

function countChinese(text: string) {
  return [...text].filter((character) => CHINESE_CHARACTER.test(character)).length
}

export async function extractFromImage(file: File, mode: ImageOcrMode, onProgress: ExtractionProgress): Promise<ExtractionResult> {
  onProgress('Loading Chinese OCR…', 0)
  const { PSM } = await import('tesseract.js')
  const worker = await createChineseWorker(onProgress)
  try {
    if (mode === 'phrase') {
      onProgress('Preparing the word or short phrase…', 0)
      const prepared = await prepareShortPhraseImage(file)
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE, user_defined_dpi: '300' })
      const result = await worker.recognize(prepared)
      return { text: cleanExtractedText(result.data.text), usedOcr: true, ocrMode: 'phrase' }
    }

    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
    const documentResult = await worker.recognize(file)
    const documentText = cleanExtractedText(documentResult.data.text)
    if (mode === 'worksheet') return { text: documentText, usedOcr: true, ocrMode: 'worksheet' }

    const documentChineseCount = countChinese(documentText)
    const nonEmptyLineCount = documentText.split('\n').filter(Boolean).length
    const looksUnreliable = !documentChineseCount
      || (documentResult.data.confidence < 55 && documentChineseCount > 8)
      || (documentChineseCount > 20 && nonEmptyLineCount > 8)
    if (!looksUnreliable) return { text: documentText, usedOcr: true, ocrMode: 'worksheet' }

    onProgress('The page result looks unreliable. Retrying as a short phrase…', 0)
    const prepared = await prepareShortPhraseImage(file)
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE, user_defined_dpi: '300' })
    const phraseResult = await worker.recognize(prepared)
    const phraseText = cleanExtractedText(phraseResult.data.text)
    const phraseChineseCount = countChinese(phraseText)
    const preferPhrase = phraseChineseCount >= 1 && phraseChineseCount <= 10
      && (documentChineseCount === 0
        || phraseResult.data.confidence >= documentResult.data.confidence
        || (nonEmptyLineCount > 8 && phraseResult.data.confidence >= 40))
    return preferPhrase
      ? { text: phraseText, usedOcr: true, ocrMode: 'phrase' }
      : { text: documentText, usedOcr: true, ocrMode: 'worksheet' }
  } finally {
    await worker.terminate()
  }
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
