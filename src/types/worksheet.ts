export interface WorksheetItem {
  id: string
  text: string
  pinyin: string
  meaning: string
  type: 'word' | 'phrase' | 'sentence'
}

import type { WordLevel } from '../data/levelWords'

export interface WorksheetOptions {
  level: WordLevel
  includeIllustrations: boolean
  includeMiniTest: boolean
}
