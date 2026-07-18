export interface WorksheetItem {
  id: string
  text: string
  pinyin: string
  meaning: string
  type: 'word' | 'phrase' | 'sentence'
}

export interface WorksheetOptions {
  level: 'K2' | 'P1'
  includeIllustrations: boolean
  includeMiniTest: boolean
}
