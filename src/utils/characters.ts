// Unified ideographs and their common extensions. The `u` flag makes each
// supplementary-plane character one item instead of two UTF-16 code units.
const HAN_CHARACTER = /\p{Unified_Ideograph}/gu

export function extractChineseCharacters(input: string): string[] {
  return input.match(HAN_CHARACTER) ?? []
}
