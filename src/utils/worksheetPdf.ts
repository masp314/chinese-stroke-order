import { jsPDF } from 'jspdf'
import type { WorksheetItem, WorksheetOptions } from '../types/worksheet'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const USABLE_W = PAGE_W - MARGIN * 2
const CJK_FONT = "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'SimHei', sans-serif"

const BOX_SIZE = 20
const BOX_GAP = 2
const GUIDE_COLOR = '#d0d0d0'
const TRACE_COLOR = '#d8d8d8'
const BOX_BORDER_COLOR = '#999999'

function renderChineseToImage(
  text: string,
  sizePx: number,
  color: string,
): string {
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = sizePx * scale * text.length
  canvas.height = sizePx * scale
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.font = `${sizePx * scale}px ${CJK_FONT}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  for (let i = 0; i < text.length; i++) {
    const charW = sizePx * scale
    const measured = ctx.measureText(text[i])
    const xOffset = (charW - measured.width) / 2
    ctx.fillText(text[i], i * charW + xOffset, sizePx * scale * 0.05)
  }
  return canvas.toDataURL('image/png')
}

function renderPinyinToImage(text: string, sizePx: number): string {
  const scale = 2
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `${sizePx * scale}px ${CJK_FONT}`
  const measured = ctx.measureText(text)
  canvas.width = Math.ceil(measured.width) + 4
  canvas.height = sizePx * scale + 4
  ctx.fillStyle = '#334155'
  ctx.font = `${sizePx * scale}px ${CJK_FONT}`
  ctx.textBaseline = 'top'
  ctx.fillText(text, 2, 2)
  return canvas.toDataURL('image/png')
}

function drawBox(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  showGuides: boolean,
  traceChar?: string,
) {
  doc.setDrawColor(BOX_BORDER_COLOR)
  doc.setLineWidth(0.3)
  doc.rect(x, y, size, size)

  if (showGuides) {
    doc.setDrawColor(GUIDE_COLOR)
    doc.setLineWidth(0.15)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(x + size / 2, y, x + size / 2, y + size)
    doc.line(x, y + size / 2, x + size, y + size / 2)
    doc.setLineDashPattern([], 0)
  }

  if (traceChar) {
    const img = renderChineseToImage(traceChar, Math.round(size * 3.5), TRACE_COLOR)
    doc.addImage(img, 'PNG', x + 0.5, y + 0.5, size - 1, size - 1)
  }
}

function getMinRepetitions(charCount: number): number {
  if (charCount <= 1) return 12
  if (charCount === 2) return 10
  if (charCount === 3) return 7
  if (charCount === 4) return 5
  return 4
}

function addCoverPage(
  doc: jsPDF,
  items: WorksheetItem[],
  options: WorksheetOptions,
) {
  let y = MARGIN + 20

  doc.setFontSize(28)
  doc.setTextColor('#ef7f6d')
  doc.text('Chinese Writing Practice', PAGE_W / 2, y, { align: 'center' })
  y += 12

  doc.setFontSize(16)
  doc.setTextColor('#518a80')
  doc.text(`${options.level} Practice`, PAGE_W / 2, y, { align: 'center' })
  y += 20

  doc.setDrawColor('#e8e8e8')
  doc.setLineWidth(0.3)
  doc.line(MARGIN + 20, y, PAGE_W - MARGIN - 20, y)
  y += 15

  for (const item of items) {
    if (y > PAGE_H - MARGIN - 30) break

    const charImg = renderChineseToImage(item.text, 28, '#334155')
    const charW = 28 * 0.75 * item.text.length
    const startX = (PAGE_W - charW) / 2
    doc.addImage(charImg, 'PNG', startX, y - 8, charW, 28 * 0.75)
    y += 18

    const pinyinImg = renderPinyinToImage(item.pinyin, 11)
    const pinyinCanvas = document.createElement('canvas')
    const pCtx = pinyinCanvas.getContext('2d')!
    pCtx.font = `22px ${CJK_FONT}`
    const pMeasured = pCtx.measureText(item.pinyin)
    const pinyinW = Math.min(pMeasured.width / 2 * 0.75, USABLE_W)
    doc.addImage(pinyinImg, 'PNG', (PAGE_W - pinyinW) / 2, y - 4, pinyinW, 11 * 0.75)
    y += 10

    if (item.meaning) {
      doc.setFontSize(11)
      doc.setTextColor('#666666')
      doc.text(item.meaning, PAGE_W / 2, y, { align: 'center' })
      y += 6
    }

    y += 10
  }

  y = Math.max(y, PAGE_H - MARGIN - 40)
  doc.setFontSize(10)
  doc.setTextColor('#89939e')
  doc.text('Look, read, and say.', PAGE_W / 2, y, { align: 'center' })
}

function addPracticePages(
  doc: jsPDF,
  item: WorksheetItem,
) {
  doc.addPage()

  const charCount = item.text.length
  let y = MARGIN

  doc.setFontSize(11)
  doc.setTextColor('#89939e')
  doc.text(`Practice: ${item.meaning || ''}`, MARGIN, y + 4)
  y += 10

  const headerImg = renderChineseToImage(item.text, 32, '#334155')
  const headerW = 32 * 0.75 * charCount
  doc.addImage(headerImg, 'PNG', MARGIN, y - 6, headerW, 32 * 0.75)

  const pinyinImg = renderPinyinToImage(item.pinyin, 11)
  const pCanvas = document.createElement('canvas')
  const pCtx = pCanvas.getContext('2d')!
  pCtx.font = `22px ${CJK_FONT}`
  const pM = pCtx.measureText(item.pinyin)
  const pW = Math.min(pM.width / 2 * 0.75, USABLE_W)
  doc.addImage(pinyinImg, 'PNG', MARGIN + headerW + 4, y - 2, pW, 11 * 0.75)
  y += 24

  doc.setDrawColor('#e0e0e0')
  doc.setLineWidth(0.2)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 6

  // Section 1: Trace each character
  doc.setFontSize(10)
  doc.setTextColor('#518a80')
  doc.text('1. Trace each character', MARGIN, y + 3)
  y += 8

  const traceBoxSize = Math.min(BOX_SIZE + 4, 24)
  for (let i = 0; i < charCount; i++) {
    const x = MARGIN + i * (traceBoxSize + BOX_GAP * 2)
    if (x + traceBoxSize > PAGE_W - MARGIN) break
    drawBox(doc, x, y, traceBoxSize, true, item.text[i])
  }
  y += traceBoxSize + 8

  doc.setDrawColor('#e0e0e0')
  doc.setLineWidth(0.2)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 6

  // Section 2: Trace, then write
  doc.setFontSize(10)
  doc.setTextColor('#518a80')
  doc.text('2. Trace, then write', MARGIN, y + 3)
  y += 8

  const wordWidth = charCount * (BOX_SIZE + BOX_GAP) - BOX_GAP
  const wordsPerRow = Math.max(1, Math.floor((USABLE_W + BOX_GAP) / (wordWidth + BOX_GAP * 3)))
  const rowHeight = BOX_SIZE + BOX_GAP * 2

  const minReps = getMinRepetitions(charCount)
  const availableHeight = PAGE_H - MARGIN - y - 30
  const totalRows = Math.floor(availableHeight / rowHeight)
  const totalReps = totalRows * wordsPerRow

  const needsExtraPage = totalReps < minReps

  const tracedReps = Math.min(2, totalReps)

  let repCount = 0
  let currentY = y

  for (let row = 0; row < totalRows; row++) {
    if (currentY + BOX_SIZE > PAGE_H - MARGIN - 20) break

    for (let col = 0; col < wordsPerRow; col++) {
      if (repCount >= totalReps) break
      const baseX = MARGIN + col * (wordWidth + BOX_GAP * 3)

      for (let c = 0; c < charCount; c++) {
        const bx = baseX + c * (BOX_SIZE + BOX_GAP)
        if (bx + BOX_SIZE > PAGE_W - MARGIN) break
        const isTraced = repCount < tracedReps
        drawBox(doc, bx, currentY, BOX_SIZE, true, isTraced ? item.text[c] : undefined)
      }
      repCount++
    }
    currentY += rowHeight
  }

  // Section 3: Read aloud
  currentY += 4
  if (currentY + 20 < PAGE_H - MARGIN) {
    doc.setFontSize(10)
    doc.setTextColor('#518a80')
    doc.text('3. Read aloud', MARGIN, currentY + 3)
    currentY += 8

    const readImg = renderChineseToImage(item.text, 16, '#334155')
    const readW = 16 * 0.75 * charCount
    doc.addImage(readImg, 'PNG', MARGIN, currentY - 3, readW, 16 * 0.75)

    const rpImg = renderPinyinToImage(item.pinyin, 9)
    const rpCanvas = document.createElement('canvas')
    const rpCtx = rpCanvas.getContext('2d')!
    rpCtx.font = `18px ${CJK_FONT}`
    const rpM = rpCtx.measureText(item.pinyin)
    const rpW = Math.min(rpM.width / 2 * 0.75, 80)
    doc.addImage(rpImg, 'PNG', MARGIN + readW + 4, currentY - 1, rpW, 9 * 0.75)

    currentY += 14
    doc.setFontSize(9)
    doc.setTextColor('#666666')
    doc.text('Say it 3 times:', MARGIN, currentY)
    for (let ci = 0; ci < 3; ci++) {
      const cx = MARGIN + 32 + ci * 10
      doc.setDrawColor('#999999')
      doc.setLineWidth(0.3)
      doc.rect(cx, currentY - 3, 4, 4)
    }
  }

  if (needsExtraPage) {
    addExtraPracticePage(doc, item, minReps - repCount)
  }
}

function addExtraPracticePage(
  doc: jsPDF,
  item: WorksheetItem,
  remaining: number,
) {
  doc.addPage()

  const charCount = item.text.length
  let y = MARGIN

  doc.setFontSize(10)
  doc.setTextColor('#518a80')
  doc.text('Practice (continued):', MARGIN, y + 3)
  const contImg = renderChineseToImage(item.text, 10, '#518a80')
  const contW = 10 * 0.75 * charCount
  doc.addImage(contImg, 'PNG', MARGIN + 42, y - 1, contW, 10 * 0.75)
  y += 10

  const wordWidth = charCount * (BOX_SIZE + BOX_GAP) - BOX_GAP
  const wordsPerRow = Math.max(1, Math.floor((USABLE_W + BOX_GAP) / (wordWidth + BOX_GAP * 3)))
  const rowHeight = BOX_SIZE + BOX_GAP * 2

  const availableHeight = PAGE_H - MARGIN - y - 10
  const totalRows = Math.floor(availableHeight / rowHeight)
  const maxReps = totalRows * wordsPerRow
  const reps = Math.max(remaining, maxReps)

  let repCount = 0
  let currentY = y

  for (let row = 0; row < totalRows; row++) {
    if (repCount >= reps) break
    for (let col = 0; col < wordsPerRow; col++) {
      if (repCount >= reps) break
      const baseX = MARGIN + col * (wordWidth + BOX_GAP * 3)
      for (let c = 0; c < charCount; c++) {
        const bx = baseX + c * (BOX_SIZE + BOX_GAP)
        if (bx + BOX_SIZE > PAGE_W - MARGIN) break
        drawBox(doc, bx, currentY, BOX_SIZE, true)
      }
      repCount++
    }
    currentY += rowHeight
  }
}

function addMiniTestPage(
  doc: jsPDF,
  items: WorksheetItem[],
) {
  doc.addPage()

  let y = MARGIN

  doc.setFontSize(16)
  doc.setTextColor('#ef7f6d')
  doc.text('Mini Test', PAGE_W / 2, y + 5, { align: 'center' })
  y += 16

  // Activity 1: Match pinyin and Chinese
  doc.setFontSize(11)
  doc.setTextColor('#518a80')
  doc.text('1. Match the pinyin and the Chinese', MARGIN, y + 3)
  y += 10

  const shuffledItems = [...items].sort(() => Math.random() - 0.5)
  const colW = USABLE_W / 2

  for (let i = 0; i < Math.min(items.length, 8); i++) {
    const item = items[i]
    const shuffled = shuffledItems[i]

    doc.setFontSize(10)
    doc.setTextColor('#334155')
    doc.text(`${i + 1}.`, MARGIN + 4, y + 4)
    const pinyinMatchImg = renderPinyinToImage(item.pinyin, 10)
    const pmCanvas = document.createElement('canvas')
    const pmCtx = pmCanvas.getContext('2d')!
    pmCtx.font = `20px ${CJK_FONT}`
    const pmM = pmCtx.measureText(item.pinyin)
    const pmW = Math.min(pmM.width / 2 * 0.75, colW - 20)
    doc.addImage(pinyinMatchImg, 'PNG', MARGIN + 14, y, pmW, 10 * 0.75)

    const matchImg = renderChineseToImage(shuffled.text, 12, '#334155')
    const matchW = 12 * 0.75 * shuffled.text.length
    doc.addImage(matchImg, 'PNG', MARGIN + colW + 4, y, matchW, 12 * 0.75)

    doc.setDrawColor('#d0d0d0')
    doc.setLineWidth(0.1)
    doc.line(MARGIN, y + 7, PAGE_W - MARGIN, y + 7)
    y += 10
  }

  y += 8

  // Activity 2: Copy the word
  doc.setFontSize(11)
  doc.setTextColor('#518a80')
  doc.text('2. Copy the word or phrase', MARGIN, y + 3)
  y += 10

  for (const item of items.slice(0, 6)) {
    if (y + BOX_SIZE + 10 > PAGE_H - MARGIN - 40) break

    const modelImg = renderChineseToImage(item.text, 14, '#334155')
    const modelW = 14 * 0.75 * item.text.length
    doc.addImage(modelImg, 'PNG', MARGIN, y - 3, modelW, 14 * 0.75)

    const boxStartX = MARGIN + modelW + 8
    const charCount = item.text.length
    for (let c = 0; c < charCount; c++) {
      const bx = boxStartX + c * (16 + 2)
      if (bx + 16 > PAGE_W - MARGIN) break
      drawBox(doc, bx, y - 4, 16, true)
    }

    y += BOX_SIZE + 2
  }

  y += 8

  // Activity 3: Self-check
  if (y + 40 < PAGE_H - MARGIN) {
    doc.setFontSize(11)
    doc.setTextColor('#518a80')
    doc.text('3. Circle when done:', MARGIN, y + 3)
    y += 10

    doc.setFontSize(10)
    doc.setTextColor('#334155')
    const checks = [
      'I can read it.',
      'I can write it.',
      'I can say the pinyin.',
    ]
    for (const check of checks) {
      doc.circle(MARGIN + 4, y + 1, 3)
      doc.text(check, MARGIN + 12, y + 3)
      y += 9
    }
  }
}

export interface PdfResult {
  blobUrl: string
  filename: string
}

export function generateWorksheetPdf(
  items: WorksheetItem[],
  options: WorksheetOptions,
): PdfResult {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  addCoverPage(doc, items, options)

  for (const item of items) {
    addPracticePages(doc, item)
  }

  if (options.includeMiniTest && items.length > 0) {
    addMiniTestPage(doc, items)
  }

  const filename = `Chinese_Writing_Practice_${options.level}.pdf`
  const blob = doc.output('blob')
  const blobUrl = URL.createObjectURL(blob)
  return { blobUrl, filename }
}
