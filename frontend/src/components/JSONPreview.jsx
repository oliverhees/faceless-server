import { X, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import './JSONPreview.css'

function JSONPreview({ templateData, onClose }) {
  const [copied, setCopied] = useState(false)

  const jsonString = JSON.stringify(templateData, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="json-preview-overlay" onClick={onClose}>
      <div className="json-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="json-preview-header">
          <h3>JSON Preview</h3>
          <div className="json-preview-actions">
            <button onClick={handleCopy} className="secondary">
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={onClose} className="close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="json-preview-content">
          <pre>
            <code>{jsonString}</code>
          </pre>
        </div>

        <div className="json-preview-footer">
          <p>This is the JSON representation of your template that will be saved to the API</p>
        </div>
      </div>
    </div>
  )
}

export default JSONPreview
