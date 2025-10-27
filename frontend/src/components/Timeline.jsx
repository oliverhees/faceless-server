import { Video, Music, Mic, Type, Trash2 } from 'lucide-react'
import './Timeline.css'

const ICON_MAP = {
  video: Video,
  audio: Music,
  voiceover: Mic,
  variable: Type,
}

function Timeline({ templateData, selectedItem, onSelectItem, onUpdateComponent, onDeleteComponent }) {
  const allComponents = [
    ...(templateData.video_sources || []),
    ...(templateData.audio_sources || []),
    ...(templateData.variables || []),
  ]

  const handleSelect = (component) => {
    onSelectItem(component)
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirm('Delete this component?')) {
      onDeleteComponent(id)
    }
  }

  return (
    <div className="timeline">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-info">
          <span>{allComponents.length} components</span>
          <span className="separator">•</span>
          <span>{templateData.output?.duration || 0}s duration</span>
        </div>
      </div>

      <div className="timeline-content">
        {allComponents.length === 0 ? (
          <div className="timeline-empty">
            <p>Your timeline is empty</p>
            <p className="timeline-hint">Add components from the left sidebar to get started</p>
          </div>
        ) : (
          <div className="component-tracks">
            {/* Video Track */}
            {templateData.video_sources && templateData.video_sources.length > 0 && (
              <div className="track">
                <div className="track-label">
                  <Video size={16} />
                  <span>Video</span>
                </div>
                <div className="track-items">
                  {templateData.video_sources.map((component) => (
                    <TimelineItem
                      key={component.id}
                      component={component}
                      selected={selectedItem?.id === component.id}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio Track */}
            {templateData.audio_sources && templateData.audio_sources.length > 0 && (
              <div className="track">
                <div className="track-label">
                  <Music size={16} />
                  <span>Audio</span>
                </div>
                <div className="track-items">
                  {templateData.audio_sources.map((component) => (
                    <TimelineItem
                      key={component.id}
                      component={component}
                      selected={selectedItem?.id === component.id}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Variables Track */}
            {templateData.variables && templateData.variables.length > 0 && (
              <div className="track">
                <div className="track-label">
                  <Type size={16} />
                  <span>Variables</span>
                </div>
                <div className="track-items">
                  {templateData.variables.map((component) => (
                    <TimelineItem
                      key={component.id}
                      component={component}
                      selected={selectedItem?.id === component.id}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineItem({ component, selected, onSelect, onDelete }) {
  const Icon = ICON_MAP[component.type] || Type

  return (
    <div
      className={`timeline-item ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(component)}
    >
      <div className="timeline-item-header">
        <Icon size={14} />
        <span className="timeline-item-type">{component.type}</span>
      </div>

      <div className="timeline-item-content">
        <strong>{component.name || component.src || component.type}</strong>
        {component.duration && <span className="duration">{component.duration}s</span>}
      </div>

      <button
        className="timeline-item-delete"
        onClick={(e) => onDelete(e, component.id)}
        title="Delete component"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default Timeline
