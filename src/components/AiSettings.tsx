import { useState } from 'react'

interface AiSettingsProps {
  open: boolean
  proxyUrl: string
  onClose: () => void
  onSave: (url: string) => void
}

export function AiSettings({ open, proxyUrl, onClose, onSave }: AiSettingsProps) {
  const [draft, setDraft] = useState(proxyUrl)

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>AI Extraction Setup</h3>
        <p>Enter the URL of your AI extraction proxy. This is a server endpoint that forwards image data to Gemini for Chinese text extraction.</p>
        <label>
          <span>Proxy URL</span>
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://your-worker.your-account.workers.dev/extract"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="primary"
            onClick={() => { onSave(draft); onClose() }}
          >Save</button>
        </div>
        {proxyUrl && (
          <button
            type="button"
            className="link-button danger"
            onClick={() => { onSave(''); onClose() }}
          >Remove proxy URL</button>
        )}
      </div>
    </div>
  )
}
