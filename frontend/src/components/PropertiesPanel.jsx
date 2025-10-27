import { Settings } from 'lucide-react'
import './PropertiesPanel.css'

function PropertiesPanel({ templateData, selectedItem, onUpdateComponent, onUpdateTemplate }) {
  const handleComponentUpdate = (field, value) => {
    if (selectedItem) {
      onUpdateComponent(selectedItem.id, { [field]: value })
    }
  }

  const handleTemplateUpdate = (field, value) => {
    onUpdateTemplate((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleOutputUpdate = (field, value) => {
    onUpdateTemplate((prev) => ({
      ...prev,
      output: {
        ...prev.output,
        [field]: value,
      },
    }))
  }

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <Settings size={20} />
        <h3>Properties</h3>
      </div>

      <div className="properties-content">
        {/* Template Settings */}
        <div className="property-section">
          <h4>Template Settings</h4>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={templateData.description || ''}
              onChange={(e) => handleTemplateUpdate('description', e.target.value)}
              placeholder="Describe your template..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={templateData.category || 'tiktok'}
              onChange={(e) => handleTemplateUpdate('category', e.target.value)}
            >
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="product">Product Ads</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Output Settings */}
        <div className="property-section">
          <h4>Output Settings</h4>

          <div className="form-row">
            <div className="form-group">
              <label>Width</label>
              <input
                type="number"
                value={templateData.output?.width || 1080}
                onChange={(e) => handleOutputUpdate('width', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Height</label>
              <input
                type="number"
                value={templateData.output?.height || 1920}
                onChange={(e) => handleOutputUpdate('height', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>FPS</label>
              <input
                type="number"
                value={templateData.output?.fps || 30}
                onChange={(e) => handleOutputUpdate('fps', parseInt(e.target.value))}
                min={24}
                max={60}
              />
            </div>

            <div className="form-group">
              <label>Duration (s)</label>
              <input
                type="number"
                value={templateData.output?.duration || 10}
                onChange={(e) => handleOutputUpdate('duration', parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>

          <div className="preset-buttons">
            <button
              className="preset-btn"
              onClick={() => {
                handleOutputUpdate('width', 1080)
                handleOutputUpdate('height', 1920)
              }}
            >
              TikTok (9:16)
            </button>
            <button
              className="preset-btn"
              onClick={() => {
                handleOutputUpdate('width', 1920)
                handleOutputUpdate('height', 1080)
              }}
            >
              YouTube (16:9)
            </button>
            <button
              className="preset-btn"
              onClick={() => {
                handleOutputUpdate('width', 1080)
                handleOutputUpdate('height', 1080)
              }}
            >
              Instagram (1:1)
            </button>
          </div>
        </div>

        {/* Component Properties */}
        {selectedItem ? (
          <div className="property-section">
            <h4>Component Properties</h4>
            <p className="section-subtitle">Editing: {selectedItem.type}</p>

            {selectedItem.type === 'video' && (
              <>
                <div className="form-group">
                  <label>Source URL</label>
                  <input
                    type="text"
                    value={selectedItem.src || ''}
                    onChange={(e) => handleComponentUpdate('src', e.target.value)}
                    placeholder="{{video_url}}"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start (s)</label>
                    <input
                      type="number"
                      value={selectedItem.start || 0}
                      onChange={(e) => handleComponentUpdate('start', parseFloat(e.target.value))}
                      step={0.1}
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (s)</label>
                    <input
                      type="number"
                      value={selectedItem.duration || 5}
                      onChange={(e) => handleComponentUpdate('duration', parseFloat(e.target.value))}
                      step={0.1}
                      min={0.1}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Scale</label>
                  <select
                    value={selectedItem.scale || 'cover'}
                    onChange={(e) => handleComponentUpdate('scale', e.target.value)}
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>
              </>
            )}

            {(selectedItem.type === 'audio' || selectedItem.type === 'voiceover') && (
              <>
                <div className="form-group">
                  <label>Source URL</label>
                  <input
                    type="text"
                    value={selectedItem.src || ''}
                    onChange={(e) => handleComponentUpdate('src', e.target.value)}
                    placeholder="{{audio_url}}"
                  />
                </div>

                <div className="form-group">
                  <label>Volume</label>
                  <input
                    type="range"
                    value={selectedItem.volume || 0.5}
                    onChange={(e) => handleComponentUpdate('volume', parseFloat(e.target.value))}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <span className="range-value">{selectedItem.volume || 0.5}</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fade In (s)</label>
                    <input
                      type="number"
                      value={selectedItem.fade_in || 0}
                      onChange={(e) => handleComponentUpdate('fade_in', parseFloat(e.target.value))}
                      step={0.1}
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label>Fade Out (s)</label>
                    <input
                      type="number"
                      value={selectedItem.fade_out || 0}
                      onChange={(e) => handleComponentUpdate('fade_out', parseFloat(e.target.value))}
                      step={0.1}
                      min={0}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedItem.type === 'variable' && (
              <>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(e) => handleComponentUpdate('name', e.target.value)}
                    placeholder="variable_name"
                  />
                </div>

                <div className="form-group">
                  <label>Default Value</label>
                  <input
                    type="text"
                    value={selectedItem.default_value || ''}
                    onChange={(e) => handleComponentUpdate('default_value', e.target.value)}
                    placeholder="Default value"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={selectedItem.description || ''}
                    onChange={(e) => handleComponentUpdate('description', e.target.value)}
                    placeholder="Describe this variable..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="property-section">
            <div className="no-selection">
              <p>No component selected</p>
              <p className="hint">Select a component from the timeline to edit its properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPanel
