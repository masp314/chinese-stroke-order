import HanziWriter, { type CharacterJson } from 'hanzi-writer'

/**
 * Single boundary for stroke-data loading. Version 1 delegates to Hanzi
 * Writer's default CDN. Replace this implementation with a local asset lookup
 * to make stroke data fully offline later; UI components do not need to change.
 */
export async function loadCharacterData(character: string): Promise<CharacterJson> {
  const data = await HanziWriter.loadCharacterData(character)
  if (!data) throw new Error(`No stroke data returned for ${character}`)
  return data
}
