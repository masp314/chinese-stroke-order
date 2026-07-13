interface CharacterListProps {
  characters: string[]
  currentIndex: number
  onSelect: (index: number) => void
}

export function CharacterList({ characters, currentIndex, onSelect }: CharacterListProps) {
  return (
    <div className="character-list" aria-label="Characters to practise">
      {characters.map((character, index) => (
        <button
          type="button"
          className={index === currentIndex ? 'character-chip active' : 'character-chip'}
          aria-current={index === currentIndex ? 'true' : undefined}
          aria-label={`${character}, character ${index + 1} of ${characters.length}`}
          onClick={() => onSelect(index)}
          key={`${character}-${index}`}
        >
          {character}
        </button>
      ))}
    </div>
  )
}
