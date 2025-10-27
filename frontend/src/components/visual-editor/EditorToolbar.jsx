import { Type, Image, Video, Square } from 'lucide-react'
import './EditorToolbar.css'

const PRESETS = [
  { name: 'TikTok (9:16)', width: 1080, height: 1920 },
  { name: 'YouTube (16:9)', width: 1920, height: 1080 },
  { name: 'Instagram (1:1)', width: 1080, height: 1080 },
  { name: 'Instagram Story (9:16)', width: 1080, height: 1920 },
  { name: 'Twitter (16:9)', width: 1280, height: 720 },
]

function EditorToolbar({ onAddLayer, project, onUpdateProject }) {
  const handlePresetChange = (preset) => {
    onUpdateProject(prev => ({
      ...prev,
      width: preset.width,
      height: preset.height
    }))
  }

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Add Layer:</span>
        <button onClick={() => onAddLayer('text')} className="toolbar-btn" title="Add Text">
          <Type size={18} />
          <span>Text</span>
        </button>
        <button onClick={() => onAddLayer('image')} className="toolbar-btn" title="Add Image">
          <Image size={18} />
          <span>Image</span>
        </button>
        <button onClick={() => onAddLayer('video')} className="toolbar-btn" title="Add Video">
          <Video size={18} />
          <span>Video</span>
        </button>
        <button onClick={() => onAddLayer('shape')} className="toolbar-btn" title="Add Shape">
          <Square size={18} />
          <span>Shape</span>
        </button>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Format:</span>
        <select
          value={`${project.width}x${project.height}`}
          onChange={(e) => {
            const preset = PRESETS.find(p => `${p.width}x${p.height}` === e.target.value)
            if (preset) handlePresetChange(preset)
          }}
          className="format-select"
        >
          {PRESETS.map(preset => (
            <option key={preset.name} value={`${preset.width}x${preset.height}`}>
              {preset.name} ({preset.width}x{preset.height})
            </option>
          ))}
        </select>
        <span className="toolbar-info">{project.width} × {project.height}</span>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">FPS:</span>
        <input
          type="number"
          value={project.fps}
          onChange={(e) => onUpdateProject(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
          className="fps-input"
          min={24}
          max={60}
        />
      </div>
    </div>
  )
}

export default EditorToolbar
