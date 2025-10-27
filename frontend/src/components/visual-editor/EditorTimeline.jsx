import { Plus, Trash2, Play } from 'lucide-react'
import './EditorTimeline.css'

function EditorTimeline({ scenes, currentSceneId, onSelectScene, onAddScene, onUpdateScene, onDeleteScene }) {
  return (
    <div className="editor-timeline">
      <div className="timeline-header">
        <h3>Scenes</h3>
        <button onClick={onAddScene} className="add-scene-btn">
          <Plus size={16} />
          Add Scene
        </button>
      </div>

      <div className="timeline-scenes">
        {scenes.map((scene, index) => {
          const isActive = scene.id === currentSceneId

          return (
            <div
              key={scene.id}
              className={`timeline-scene ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScene(scene.id)}
            >
              <div className="scene-header">
                <span className="scene-number">{index + 1}</span>
                <input
                  type="text"
                  value={scene.name}
                  onChange={(e) => {
                    e.stopPropagation()
                    onUpdateScene(scene.id, { name: e.target.value })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="scene-name-input"
                />
              </div>

              <div className="scene-info">
                <span className="scene-duration">{scene.duration}s</span>
                <span className="scene-layers">{scene.layers.length} layers</span>
              </div>

              <div className="scene-duration-input">
                <label>Duration (s)</label>
                <input
                  type="number"
                  value={scene.duration}
                  onChange={(e) => {
                    e.stopPropagation()
                    onUpdateScene(scene.id, { duration: parseFloat(e.target.value) || 1 })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  min={0.1}
                  step={0.1}
                />
              </div>

              {scenes.length > 1 && (
                <button
                  className="delete-scene-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete scene "${scene.name}"?`)) {
                      onDeleteScene(scene.id)
                    }
                  }}
                  title="Delete scene"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="timeline-summary">
        <span>Total Duration: {scenes.reduce((sum, s) => sum + s.duration, 0).toFixed(1)}s</span>
      </div>
    </div>
  )
}

export default EditorTimeline
