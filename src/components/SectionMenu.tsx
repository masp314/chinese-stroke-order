import { useState } from 'react'

const LINKS = [
  { href: '#input', label: 'Enter text' },
  { href: '#file-import', label: 'Import image / PDF' },
  { href: '#practice', label: 'Watch & quiz' },
  { href: '#pronunciation', label: 'Listen & say' },
  { href: '#vocabulary', label: 'My vocabulary' },
  { href: '#saved-sets', label: 'My word sets' },
  { href: '#history', label: 'Recent practice' },
]

export function SectionMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="section-menu">
      <button
        className="menu-button"
        type="button"
        aria-label={open ? 'Close section menu' : 'Open section menu'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">☰</span>
      </button>
      {open && (
        <nav className="menu-popover" aria-label="Page sections">
          {LINKS.map((link) => (
            <a href={link.href} onClick={() => setOpen(false)} key={link.href}>{link.label}</a>
          ))}
        </nav>
      )}
    </div>
  )
}
