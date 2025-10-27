import { Video, Music, Mic, Type, Image as ImageIcon, Plus } from 'lucide-react'
import './ComponentLibrary.css'

const COMPONENTS = [
  {
    type: 'video',
    label: 'Video Clip',
    icon: Video,
    description: 'Add a video source',
    defaultProps: {
      type: 'video',
      src: '{{video_url}}',
      start: 0,
      duration: 5,
      scale: 'cover',
    },
  },
  {
    type: 'audio',
    label: 'Background Music',
    icon: Music,
    description: 'Add background audio',
    defaultProps: {
      type: 'audio',
      src: '{{audio_url}}',
      volume: 0.5,
      fade_in: 1,
      fade_out: 1,
    },
  },
  {
    type: 'voiceover',
    label: 'Voiceover',
    icon: Mic,
    description: 'Add voiceover audio',
    defaultProps: {
      type: 'voiceover',
      src: '{{voiceover_url}}',
      volume: 1.0,
      start: 0,
    },
  },
  {
    type: 'variable',
    label: 'Variable',
    icon: Type,
    description: 'Add a template variable',
    defaultProps: {
      type: 'variable',
      name: 'new_variable',
      default_value: '',
      description: 'Variable description',
    },
  },
]

function ComponentLibrary({ onAddComponent }) {
  const handleAddComponent = (component) => {
    onAddComponent(component.defaultProps)
  }

  return (
    <div className="component-library">
      <div className="library-header">
        <h3>Components</h3>
        <p>Drag or click to add</p>
      </div>

      <div className="component-list">
        {COMPONENTS.map((component) => {
          const Icon = component.icon
          return (
            <div
              key={component.type}
              className="component-item"
              onClick={() => handleAddComponent(component)}
            >
              <div className="component-icon">
                <Icon size={24} />
              </div>
              <div className="component-info">
                <h4>{component.label}</h4>
                <p>{component.description}</p>
              </div>
              <button className="add-component-btn">
                <Plus size={18} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="library-footer">
        <div className="info-box">
          <h4>Quick Tips</h4>
          <ul>
            <li>Use variables like <code>{'{{variable_name}}'}</code></li>
            <li>Set duration in seconds</li>
            <li>Adjust volume from 0 to 1</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ComponentLibrary
