import { useState } from 'react'

interface AiSettingsProps {
  open: boolean
  isUnlimited: boolean
  onClose: () => void
  onUnlock: (code: string) => boolean
  onLock: () => void
}

export function AiSettings({ open, isUnlimited, onClose, onUnlock, onLock }: AiSettingsProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  function handleUnlock() {
    if (onUnlock(code)) {
      setCode('')
      setError('')
      onClose()
    } else {
      setError('Incorrect code.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Unlimited AI Extraction</h3>
        {isUnlimited ? (
          <>
            <p>Unlimited AI extraction is active on this device.</p>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>Close</button>
              <button type="button" className="secondary" onClick={() => { onLock(); onClose() }}>Remove unlimited access</button>
            </div>
          </>
        ) : (
          <>
            <p>Enter the access code to unlock unlimited AI extraction on this device.</p>
            <label>
              <span>Access code</span>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock() }}
                placeholder="Enter code"
              />
            </label>
            {error && <p className="inline-message error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="primary" onClick={handleUnlock}>Unlock</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
