import { SketchPicker } from 'react-color'
import { useState } from 'react'
import './EditorProperties.css'

function EditorProperties({ layer, onUpdateLayer, canvasWidth, canvasHeight }) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)

  if (!layer) {
    return (
      <div className="editor-properties">
        <div className="properties-header">
          <h3>Properties</h3>
        </div>
        <div className="properties-empty">
          <p>No layer selected</p>
          <p className="hint">Select a layer to edit its properties</p>
        </div>
      </div>
    )
  }

  const updateProperty = (key, value) => {
    onUpdateLayer({
      properties: {
        ...layer.properties,
        [key]: value
      }
    })
  }

  return (
    <div className="editor-properties">
      <div className="properties-header">
        <h3>Properties</h3>
        <span className="layer-type-badge">{layer.type}</span>
      </div>

      <div className="properties-content">
        {/* Transform Properties */}
        <div className="property-section">
          <h4>Transform</h4>

          <div className="property-row">
            <div className="property-field">
              <label>X</label>
              <input
                type="number"
                value={Math.round(layer.properties.x)}
                onChange={(e) => updateProperty('x', parseFloat(e.target.value))}
                step={1}
              />
            </div>
            <div className="property-field">
              <label>Y</label>
              <input
                type="number"
                value={Math.round(layer.properties.y)}
                onChange={(e) => updateProperty('y', parseFloat(e.target.value))}
                step={1}
              />
            </div>
          </div>

          <div className="property-row">
            <div className="property-field">
              <label>Width</label>
              <input
                type="number"
                value={Math.round(layer.properties.width)}
                onChange={(e) => updateProperty('width', parseFloat(e.target.value))}
                step={1}
                min={1}
              />
            </div>
            <div className="property-field">
              <label>Height</label>
              <input
                type="number"
                value={Math.round(layer.properties.height)}
                onChange={(e) => updateProperty('height', parseFloat(e.target.value))}
                step={1}
                min={1}
              />
            </div>
          </div>

          <div className="property-field">
            <label>Rotation</label>
            <input
              type="number"
              value={Math.round(layer.properties.rotation)}
              onChange={(e) => updateProperty('rotation', parseFloat(e.target.value))}
              step={1}
              min={-180}
              max={180}
            />
          </div>

          <div className="property-field">
            <label>Opacity</label>
            <input
              type="range"
              value={layer.properties.opacity}
              onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
              min={0}
              max={1}
              step={0.01}
            />
            <span className="range-value">{Math.round(layer.properties.opacity * 100)}%</span>
          </div>
        </div>

        {/* Text Properties */}
        {layer.type === 'text' && (
          <>
            <div className="property-section">
              <h4>Text Content</h4>
              <textarea
                value={layer.properties.text}
                onChange={(e) => updateProperty('text', e.target.value)}
                rows={3}
                placeholder="Enter text..."
              />
            </div>

            <div className="property-section">
              <h4>Typography</h4>

              <div className="property-field">
                <label>Font Family</label>
                <select
                  value={layer.properties.fontFamily}
                  onChange={(e) => updateProperty('fontFamily', e.target.value)}
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>

              <div className="property-field">
                <label>Font Size</label>
                <input
                  type="number"
                  value={layer.properties.fontSize}
                  onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                  min={8}
                  max={200}
                />
              </div>

              <div className="property-row">
                <div className="property-field">
                  <label>Weight</label>
                  <select
                    value={layer.properties.fontWeight}
                    onChange={(e) => updateProperty('fontWeight', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
                <div className="property-field">
                  <label>Style</label>
                  <select
                    value={layer.properties.fontStyle}
                    onChange={(e) => updateProperty('fontStyle', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
              </div>

              <div className="property-field">
                <label>Text Align</label>
                <select
                  value={layer.properties.textAlign}
                  onChange={(e) => updateProperty('textAlign', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="property-field">
                <label>Color</label>
                <div className="color-picker-wrapper">
                  <div
                    className="color-preview"
                    style={{ background: layer.properties.color }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <input
                    type="text"
                    value={layer.properties.color}
                    onChange={(e) => updateProperty('color', e.target.value)}
                  />
                </div>
                {showColorPicker && (
                  <div className="color-picker-popover">
                    <div className="color-picker-cover" onClick={() => setShowColorPicker(false)} />
                    <SketchPicker
                      color={layer.properties.color}
                      onChange={(color) => updateProperty('color', color.hex)}
                    />
                  </div>
                )}
              </div>

              <div className="property-field">
                <label>Background Color</label>
                <div className="color-picker-wrapper">
                  <div
                    className="color-preview"
                    style={{ background: layer.properties.backgroundColor || 'transparent' }}
                    onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                  />
                  <input
                    type="text"
                    value={layer.properties.backgroundColor}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    placeholder="transparent"
                  />
                </div>
                {showBgColorPicker && (
                  <div className="color-picker-popover">
                    <div className="color-picker-cover" onClick={() => setShowBgColorPicker(false)} />
                    <SketchPicker
                      color={layer.properties.backgroundColor || '#ffffff'}
                      onChange={(color) => updateProperty('backgroundColor', color.hex)}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Shape Properties */}
        {layer.type === 'shape' && (
          <div className="property-section">
            <h4>Shape</h4>

            <div className="property-field">
              <label>Shape Type</label>
              <select
                value={layer.properties.shapeType}
                onChange={(e) => updateProperty('shapeType', e.target.value)}
              >
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </div>

            <div className="property-field">
              <label>Fill Color</label>
              <div className="color-picker-wrapper">
                <div
                  className="color-preview"
                  style={{ background: layer.properties.fill }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <input
                  type="text"
                  value={layer.properties.fill}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                />
              </div>
              {showColorPicker && (
                <div className="color-picker-popover">
                  <div className="color-picker-cover" onClick={() => setShowColorPicker(false)} />
                  <SketchPicker
                    color={layer.properties.fill}
                    onChange={(color) => updateProperty('fill', color.hex)}
                  />
                </div>
              )}
            </div>

            {layer.properties.shapeType === 'rectangle' && (
              <div className="property-field">
                <label>Corner Radius</label>
                <input
                  type="number"
                  value={layer.properties.cornerRadius}
                  onChange={(e) => updateProperty('cornerRadius', parseInt(e.target.value))}
                  min={0}
                />
              </div>
            )}
          </div>
        )}

        {/* Image Properties */}
        {layer.type === 'image' && (
          <div className="property-section">
            <h4>Image</h4>
            <div className="property-field">
              <label>Image URL</label>
              <input
                type="text"
                value={layer.properties.src}
                onChange={(e) => updateProperty('src', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}

        {/* Video Properties */}
        {layer.type === 'video' && (
          <div className="property-section">
            <h4>Video</h4>
            <div className="property-field">
              <label>Video URL</label>
              <input
                type="text"
                value={layer.properties.src}
                onChange={(e) => updateProperty('src', e.target.value)}
                placeholder="https://example.com/video.mp4"
              />
            </div>

            <div className="property-row">
              <div className="property-field">
                <label>Start (s)</label>
                <input
                  type="number"
                  value={layer.properties.startTime}
                  onChange={(e) => updateProperty('startTime', parseFloat(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="property-field">
                <label>End (s)</label>
                <input
                  type="number"
                  value={layer.properties.endTime}
                  onChange={(e) => updateProperty('endTime', parseFloat(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            <div className="property-field">
              <label>Volume</label>
              <input
                type="range"
                value={layer.properties.volume}
                onChange={(e) => updateProperty('volume', parseFloat(e.target.value))}
                min={0}
                max={1}
                step={0.01}
              />
              <span className="range-value">{Math.round(layer.properties.volume * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorProperties
