export type Speed = 'slow' | 'normal' | 'fast'

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'quizzing' | 'unsupported'

export type PracticeMode = 'watch' | 'quiz'

export interface SavedWordSet {
  id: string
  title: string
  text: string
  createdAt: string
  pinyin?: string
}

export interface HistoryItem {
  text: string
  lastUsedAt: string
}
