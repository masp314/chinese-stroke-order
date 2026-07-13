import { pinyin } from 'pinyin-pro'

export function getPinyin(text: string): string {
  if (!text) return ''
  return pinyin(text, { toneType: 'symbol', type: 'string' })
}
