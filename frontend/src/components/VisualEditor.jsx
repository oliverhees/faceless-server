import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Save, Download } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import EditorCanvas from './visual-editor/EditorCanvas'
import LayerPanel from './visual-editor/LayerPanel'
import EditorTimeline from './visual-editor/EditorTimeline'
import EditorProperties from './visual-editor/EditorProperties'
import EditorToolbar from './visual-editor/EditorToolbar'
import { templateAPI } from '../services/api'
import './VisualEditor.css'

function VisualEditor({ template, onBack }) {
  // Project state
  const [project, setProject] = useState({
    name: template?.template_name || 'New Video',
    description: template?.description || '',
    category: template?.category || 'tiktok',
    width: 1080,
    height: 1920,
    fps: 30,
    scenes: []
  })

  const [currentSceneId, setCurrentSceneId] = useState(null)
  const [selectedLayerId, setSelectedLayerId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Initialize with empty scene
  useEffect(() => {
    if (project.scenes.length === 0) {
      addScene()
    }
  }, [])

  // Load existing template
  useEffect(() => {
    if (template && template.scenes) {
      setProject({
        name: template.template_name,
        description: template.description,
        category: template.category,
        width: template.output?.width || 1080,
        height: template.output?.height || 1920,
        fps: template.output?.fps || 30,
        scenes: template.scenes || []
      })
      if (template.scenes.length > 0) {
        setCurrentSceneId(template.scenes[0].id)
      }
    }
  }, [template])

  const currentScene = project.scenes.find(s => s.id === currentSceneId)
  const selectedLayer = currentScene?.layers.find(l => l.id === selectedLayerId)

  // Scene management
  const addScene = () => {
    const newScene = {
      id: uuidv4(),
      name: `Scene ${project.scenes.length + 1}`,
      duration: 5,
      layers: []
    }
    setProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }))
    setCurrentSceneId(newScene.id)
  }

  const updateScene = (sceneId, updates) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === sceneId ? { ...s, ...updates } : s
      )
    }))
  }

  const deleteScene = (sceneId) => {
    setProject(prev => {
      const newScenes = prev.scenes.filter(s => s.id !== sceneId)
      return { ...prev, scenes: newScenes }
    })
    if (currentSceneId === sceneId && project.scenes.length > 1) {
      setCurrentSceneId(project.scenes[0].id)
    }
  }

  // Layer management
  const addLayer = (type) => {
    if (!currentSceneId) return

    const newLayer = {
      id: uuidv4(),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now()}`,
      visible: true,
      locked: false,
      properties: getDefaultProperties(type)
    }

    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === currentSceneId
          ? { ...s, layers: [...s.layers, newLayer] }
          : s
      )
    }))

    setSelectedLayerId(newLayer.id)
  }

  const updateLayer = (layerId, updates) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === currentSceneId
          ? {
              ...s,
              layers: s.layers.map(l =>
                l.id === layerId ? { ...l, ...updates } : l
              )
            }
          : s
      )
    }))
  }

  const deleteLayer = (layerId) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === currentSceneId
          ? { ...s, layers: s.layers.filter(l => l.id !== layerId) }
          : s
      )
    }))
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null)
    }
  }

  const reorderLayers = (sceneId, newLayersOrder) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === sceneId ? { ...s, layers: newLayersOrder } : s
      )
    }))
  }

  // Get default properties for layer types
  const getDefaultProperties = (type) => {
    const defaults = {
      x: project.width / 2,
      y: project.height / 2,
      width: 300,
      height: 100,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1
    }

    switch (type) {
      case 'text':
        return {
          ...defaults,
          text: 'Enter text',
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          color: '#000000',
          backgroundColor: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0
        }
      case 'image':
        return {
          ...defaults,
          src: '',
          fit: 'cover'
        }
      case 'video':
        return {
          ...defaults,
          src: '',
          startTime: 0,
          endTime: 5,
          volume: 1,
          muted: false
        }
      case 'shape':
        return {
          ...defaults,
          shapeType: 'rectangle',
          fill: '#667eea',
          stroke: '#000000',
          strokeWidth: 0,
          cornerRadius: 0
        }
      default:
        return defaults
    }
  }

  // Save project
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const templateData = {
        template_name: project.name,
        description: project.description,
        category: project.category,
        scenes: project.scenes,
        output: {
          width: project.width,
          height: project.height,
          fps: project.fps
        }
      }

      if (template?.template_id) {
        await templateAPI.update(template.template_id, templateData)
      } else {
        await templateAPI.create(templateData)
      }

      alert('Project saved successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // Export to JSON
  const handleExport = () => {
    const json = JSON.stringify(project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="visual-editor">
      <div className="visual-editor-header">
        <button onClick={onBack} className="back-btn secondary">
          <ArrowLeft size={20} />
          Back
        </button>

        <input
          type="text"
          value={project.name}
          onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
          className="project-name-input"
          placeholder="Project Name"
        />

        <div className="header-actions">
          <button onClick={handleExport} className="secondary">
            <Download size={18} />
            Export JSON
          </button>
          <button onClick={handleSave} disabled={saving} className="success">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <EditorToolbar
        onAddLayer={addLayer}
        project={project}
        onUpdateProject={setProject}
      />

      <div className="visual-editor-workspace">
        <LayerPanel
          scene={currentScene}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={updateLayer}
          onDeleteLayer={deleteLayer}
          onReorderLayers={(newOrder) => reorderLayers(currentSceneId, newOrder)}
        />

        <div className="editor-center">
          <EditorCanvas
            scene={currentScene}
            width={project.width}
            height={project.height}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
          />

          <EditorTimeline
            scenes={project.scenes}
            currentSceneId={currentSceneId}
            onSelectScene={setCurrentSceneId}
            onAddScene={addScene}
            onUpdateScene={updateScene}
            onDeleteScene={deleteScene}
          />
        </div>

        <EditorProperties
          layer={selectedLayer}
          onUpdateLayer={(updates) => updateLayer(selectedLayerId, updates)}
          canvasWidth={project.width}
          canvasHeight={project.height}
        />
      </div>
    </div>
  )
}

export default VisualEditor
