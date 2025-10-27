import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Eye, Code } from 'lucide-react'
import { templateAPI } from '../services/api'
import ComponentLibrary from './ComponentLibrary'
import Timeline from './Timeline'
import PropertiesPanel from './PropertiesPanel'
import JSONPreview from './JSONPreview'
import './TemplateBuilder.css'

function TemplateBuilder({ template, onBack }) {
  const [templateData, setTemplateData] = useState({
    template_name: '',
    description: '',
    category: 'tiktok',
    variables: [],
    video_sources: [],
    audio_sources: [],
    output: {
      width: 1080,
      height: 1920,
      fps: 30,
      duration: 10,
    },
  })

  const [selectedItem, setSelectedItem] = useState(null)
  const [showJSONPreview, setShowJSONPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (template) {
      // Load existing template
      setTemplateData(template)
    }
  }, [template])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!templateData.template_name) {
        throw new Error('Please enter a template name')
      }

      if (template?.template_id) {
        // Update existing
        await templateAPI.update(template.template_id, templateData)
      } else {
        // Create new
        await templateAPI.create(templateData)
      }

      alert('Template saved successfully!')
      onBack()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save template')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComponent = (component) => {
    const newComponent = {
      id: `${component.type}_${Date.now()}`,
      ...component,
    }

    if (component.type === 'video') {
      setTemplateData((prev) => ({
        ...prev,
        video_sources: [...prev.video_sources, newComponent],
      }))
    } else if (component.type === 'audio' || component.type === 'voiceover') {
      setTemplateData((prev) => ({
        ...prev,
        audio_sources: [...prev.audio_sources, newComponent],
      }))
    } else if (component.type === 'variable') {
      setTemplateData((prev) => ({
        ...prev,
        variables: [...prev.variables, newComponent],
      }))
    }
  }

  const handleUpdateComponent = (id, updates) => {
    setTemplateData((prev) => {
      const updatedData = { ...prev }

      // Update in video_sources
      updatedData.video_sources = prev.video_sources.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )

      // Update in audio_sources
      updatedData.audio_sources = prev.audio_sources.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )

      // Update in variables
      updatedData.variables = prev.variables.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )

      return updatedData
    })
  }

  const handleDeleteComponent = (id) => {
    setTemplateData((prev) => ({
      ...prev,
      video_sources: prev.video_sources.filter((item) => item.id !== id),
      audio_sources: prev.audio_sources.filter((item) => item.id !== id),
      variables: prev.variables.filter((item) => item.id !== id),
    }))

    if (selectedItem?.id === id) {
      setSelectedItem(null)
    }
  }

  return (
    <div className="template-builder">
      <div className="builder-header">
        <button onClick={onBack} className="back-btn secondary">
          <ArrowLeft size={20} />
          Back to Templates
        </button>

        <div className="builder-title">
          <input
            type="text"
            value={templateData.template_name}
            onChange={(e) =>
              setTemplateData((prev) => ({ ...prev, template_name: e.target.value }))
            }
            placeholder="Template Name"
            className="template-name-input"
          />
        </div>

        <div className="builder-actions">
          <button onClick={() => setShowJSONPreview(true)} className="secondary">
            <Code size={18} />
            JSON
          </button>
          <button onClick={handleSave} disabled={saving} className="success">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="builder-workspace">
        <ComponentLibrary onAddComponent={handleAddComponent} />

        <Timeline
          templateData={templateData}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          onUpdateComponent={handleUpdateComponent}
          onDeleteComponent={handleDeleteComponent}
        />

        <PropertiesPanel
          templateData={templateData}
          selectedItem={selectedItem}
          onUpdateComponent={handleUpdateComponent}
          onUpdateTemplate={setTemplateData}
        />
      </div>

      {showJSONPreview && (
        <JSONPreview
          templateData={templateData}
          onClose={() => setShowJSONPreview(false)}
        />
      )}
    </div>
  )
}

export default TemplateBuilder
