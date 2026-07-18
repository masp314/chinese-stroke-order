import type { WorksheetItem } from '../types/worksheet'
import { extractChineseCharacters } from './characters'
import { lookupWord } from './dictionary'
import { getPinyin } from './pinyin'

function classifyText(text: string): WorksheetItem['type'] {
  const chars = extractChineseCharacters(text)
  if (chars.length >= 5) return 'sentence'
  if (chars.length >= 3) return 'phrase'
  return 'word'
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export async function createWorksheetItems(
  texts: string[],
): Promise<WorksheetItem[]> {
  const items: WorksheetItem[] = []

  for (const text of texts) {
    const chars = extractChineseCharacters(text)
    if (chars.length === 0) continue

    const joined = chars.join('')
    const pinyin = getPinyin(joined)

    let meaning = ''
    const defs = await lookupWord(joined)
    if (defs.length > 0 && defs[0].definitions.length > 0) {
      meaning = defs[0].definitions[0]
    }

    items.push({
      id: generateId(),
      text: joined,
      pinyin,
      meaning,
      type: classifyText(joined),
    })
  }

  return items
}

export function splitInputToWordList(input: string): string[] {
  const lines = input
    .split(/\n/)
    .map((l) => l.replace(/^\s*\d+[.)、]\s*/, '').trim())
    .filter((l) => l.length > 0)

  if (lines.length > 1) return lines

  const chars = extractChineseCharacters(input)
  if (chars.length === 0) return []
  return [chars.join('')]
}
