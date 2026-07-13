export interface DictEntry {
  t?: string   // traditional (omitted if same as simplified)
  p: string    // pinyin
  d: string[]  // English definitions
}

export interface WordDefinition {
  simplified: string
  traditional?: string
  pinyin: string
  definitions: string[]
}

type DictData = Record<string, DictEntry[]>

let dictCache: DictData | null = null
let loadPromise: Promise<DictData> | null = null

async function loadDict(): Promise<DictData> {
  if (dictCache) return dictCache
  if (loadPromise) return loadPromise
  loadPromise = fetch(`${import.meta.env.BASE_URL}cedict.json`)
    .then((res) => res.json() as Promise<DictData>)
    .then((data) => { dictCache = data; return data })
  return loadPromise
}

export async function lookupWord(word: string): Promise<WordDefinition[]> {
  const dict = await loadDict()
  const entries = dict[word]
  if (!entries) return []
  return entries.map((e) => ({
    simplified: word,
    traditional: e.t,
    pinyin: e.p,
    definitions: e.d,
  }))
}

export async function lookupWords(words: string[]): Promise<Map<string, WordDefinition[]>> {
  const dict = await loadDict()
  const result = new Map<string, WordDefinition[]>()
  for (const word of words) {
    const entries = dict[word]
    if (entries) {
      result.set(word, entries.map((e) => ({
        simplified: word,
        traditional: e.t,
        pinyin: e.p,
        definitions: e.d,
      })))
    }
  }
  return result
}
