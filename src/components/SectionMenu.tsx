type Tab = 'create' | 'learn' | 'library'

interface SectionMenuProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function SectionMenu({ activeTab, onTabChange }: SectionMenuProps) {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      <button
        type="button"
        className={activeTab === 'create' ? 'nav-tab active' : 'nav-tab'}
        aria-current={activeTab === 'create' ? 'page' : undefined}
        onClick={() => onTabChange('create')}
      >Create</button>
      <button
        type="button"
        className={activeTab === 'learn' ? 'nav-tab active' : 'nav-tab'}
        aria-current={activeTab === 'learn' ? 'page' : undefined}
        onClick={() => onTabChange('learn')}
      >Learn</button>
      <button
        type="button"
        className={activeTab === 'library' ? 'nav-tab active' : 'nav-tab'}
        aria-current={activeTab === 'library' ? 'page' : undefined}
        onClick={() => onTabChange('library')}
      >Library</button>
    </nav>
  )
}
