import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Image, Video, Square } from 'lucide-react'
import './LayerPanel.css'

const LAYER_ICONS = {
  text: Type,
  image: Image,
  video: Video,
  shape: Square
}

function LayerPanel({ scene, selectedLayerId, onSelectLayer, onUpdateLayer, onDeleteLayer, onReorderLayers }) {
  if (!scene) {
    return (
      <div className="layer-panel">
        <div className="layer-panel-header">
          <h3>Layers</h3>
        </div>
        <div className="layer-panel-empty">
          <p>No scene selected</p>
        </div>
      </div>
    )
  }

  const handleToggleVisibility = (layerId, currentVisible) => {
    onUpdateLayer(layerId, { visible: !currentVisible })
  }

  const handleToggleLock = (layerId, currentLocked) => {
    onUpdateLayer(layerId, { locked: !currentLocked })
  }

  const handleMoveLayer = (layerId, direction) => {
    const currentIndex = scene.layers.findIndex(l => l.id === layerId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= scene.layers.length) return

    const newLayers = [...scene.layers]
    const [movedLayer] = newLayers.splice(currentIndex, 1)
    newLayers.splice(newIndex, 0, movedLayer)
    onReorderLayers(newLayers)
  }

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Layers</h3>
        <span className="layer-count">{scene.layers.length}</span>
      </div>

      <div className="layer-list">
        {scene.layers.length === 0 ? (
          <div className="layer-panel-empty">
            <p>No layers</p>
            <p className="hint">Add layers from the toolbar above</p>
          </div>
        ) : (
          [...scene.layers].reverse().map((layer, index) => {
            const Icon = LAYER_ICONS[layer.type] || Square
            const isSelected = layer.id === selectedLayerId

            return (
              <div
                key={layer.id}
                className={`layer-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectLayer(layer.id)}
              >
                <div className="layer-icon">
                  <Icon size={16} />
                </div>

                <div className="layer-info">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-type">{layer.type}</span>
                </div>

                <div className="layer-actions">
                  <button
                    className="layer-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleVisibility(layer.id, layer.visible)
                    }}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  <button
                    className="layer-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleLock(layer.id, layer.locked)
                    }}
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>

                  <button
                    className="layer-action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete layer "${layer.name}"?`)) {
                        onDeleteLayer(layer.id)
                      }
                    }}
                    title="Delete layer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LayerPanel
