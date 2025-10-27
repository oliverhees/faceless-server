import { useState, useRef } from 'react'
import { Plus, Trash2, Music, Type, Play, Download, Mic, Speaker, ArrowLeft, Save, X } from 'lucide-react'
import { templateAPI } from '../services/api'

export default function SceneEditor({ template, onBack }) {
  const [projectName, setProjectName] = useState(template?.template_name || 'New Video')
  const [scenes, setScenes] = useState(template?.scenes || [
    { id: 1, prompt: '', duration: 8, audio: '', captions: '', transition: 'fade' }
  ])
  const [selectedScene, setSelectedScene] = useState(1)
  const [voiceOver, setVoiceOver] = useState(template?.voiceOver || '')
  const [backgroundAudio, setBackgroundAudio] = useState(template?.backgroundAudio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const scenesScrollRef = useRef(null)
  const timelineScrollRef = useRef(null)

  // Sync scroll between scenes and timeline
  const handleScenesScroll = (e) => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  const handleTimelineScroll = (e) => {
    if (scenesScrollRef.current) {
      scenesScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  const addScene = () => {
    const newId = Math.max(...scenes.map(s => s.id), 0) + 1
    setScenes([...scenes, { id: newId, prompt: '', duration: 8, audio: '', captions: '', transition: 'fade' }])
  }

  const removeScene = (id) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(s => s.id !== id))
      if (selectedScene === id) {
        setSelectedScene(scenes[0]?.id || 1)
      }
    }
  }

  const updateScene = (id, field, value) => {
    setScenes(scenes.map(s => s.id === id ? {...s, [field]: value} : s))
  }

  const updateTransition = (fromSceneId, transitionType) => {
    setScenes(scenes.map(s => s.id === fromSceneId ? {...s, transition: transitionType} : s))
  }

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)
  const selectedSceneData = scenes.find(s => s.id === selectedScene)

  const transitionTypes = [
    { value: 'fade', label: 'Fade' },
    { value: 'dissolve', label: 'Dissolve' },
    { value: 'wipeleft', label: 'Wipe Left' },
    { value: 'wiperight', label: 'Wipe Right' },
    { value: 'slideup', label: 'Slide Up' },
    { value: 'slidedown', label: 'Slide Down' },
    { value: 'circlecrop', label: 'Circle' },
    { value: 'rectcrop', label: 'Rectangle' }
  ]

  const exportJSON = () => {
    const config = {
      template_name: projectName,
      scenes: scenes.map((scene, index) => ({
        id: scene.id,
        order: index,
        prompt: scene.prompt,
        duration: scene.duration,
        audio: scene.audio || null,
        captions: scene.captions || null,
        transition: index < scenes.length - 1 ? scene.transition : null
      })),
      globalAudio: {
        voiceOver: voiceOver || null,
        background: backgroundAudio || null
      },
      totalDuration,
      output: {
        width: 1080,
        height: 1920,
        fps: 30
      }
    }

    const json = JSON.stringify(config, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const templateData = {
        template_name: projectName,
        description: `Scene-based video with ${scenes.length} scenes`,
        category: 'ai-video',
        scenes,
        voiceOver,
        backgroundAudio,
        output: {
          width: 1080,
          height: 1920,
          fps: 30,
          duration: totalDuration
        }
      }

      if (template?.template_id) {
        await templateAPI.update(template.template_id, templateData)
      } else {
        await templateAPI.create(templateData)
      }

      alert('Template saved successfully!')
      onBack()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Fixed Header */}
      <div className="bg-gray-900 px-6 py-3 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-lg font-semibold tracking-tight focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1 rounded"
            placeholder="Project Name"
          />
          <span className="text-xs text-gray-500">ffmpeg optimized</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addScene}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-1.5 transition-colors">
            <Plus size={14} />
            Add Scene
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-1.5 transition-colors">
            <Download size={14} />
            Export JSON
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-1.5 transition-colors disabled:bg-gray-600">
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 px-6 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Main Scene Area */}
      <div
        ref={scenesScrollRef}
        onScroll={handleScenesScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        <div className="h-full flex items-center px-6 gap-3" style={{ minWidth: 'max-content' }}>
          {scenes.map((scene, index) => (
            <div key={scene.id} className="flex items-center gap-3">
              {/* Scene Card */}
              <div
                onClick={() => setSelectedScene(scene.id)}
                className={`relative flex-shrink-0 cursor-pointer transition-all ${
                  selectedScene === scene.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:ring-1 ring-gray-700'
                }`}
                style={{ width: '200px', height: '400px' }}>
                <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                  {/* Video Preview */}
                  <div className="h-2/3 bg-gradient-to-br from-purple-950 via-blue-950 to-pink-950 flex items-center justify-center relative">
                    <div className="text-center">
                      <Play size={32} className="mx-auto mb-2 opacity-40" />
                      <div className="text-xs opacity-60">Scene {index + 1}</div>
                      <div className="text-xs mt-1 opacity-40">{scene.duration}s</div>
                    </div>

                    {selectedScene === scene.id && scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeScene(scene.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors">
                        <X size={12} />
                      </button>
                    )}

                    <div className="absolute bottom-2 left-2 right-2">
                      <input
                        type="number"
                        value={scene.duration}
                        onChange={(e) => updateScene(scene.id, 'duration', parseInt(e.target.value) || 8)}
                        className="w-full bg-gray-950 bg-opacity-80 text-xs px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="5"
                        max="15"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Prompt Area */}
                  <div className="h-1/3 p-2 bg-gray-900">
                    <textarea
                      value={scene.prompt}
                      onChange={(e) => updateScene(scene.id, 'prompt', e.target.value)}
                      className="w-full h-full bg-gray-800 text-xs rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Video Prompt (AI generation)..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* Transition Selector */}
              {index < scenes.length - 1 && (
                <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '80px' }}>
                  <div className="w-full space-y-1">
                    <select
                      value={scene.transition}
                      onChange={(e) => updateTransition(scene.id, e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-blue-500 transition-colors">
                      {transitionTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <div className="text-center text-xl opacity-50">→</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Panel */}
      <div className="bg-gray-900 border-t border-gray-800 flex-shrink-0">
        {/* Timeline */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-medium">Timeline</span>
            <span>Total: {totalDuration}s</span>
          </div>

          <div
            ref={timelineScrollRef}
            onScroll={handleTimelineScroll}
            className="overflow-x-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 #111827' }}>
            <div style={{ minWidth: `${Math.max(totalDuration * 20, 800)}px` }}>
              {/* Video Layer */}
              <div className="mb-1">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Play size={10} />
                  Video
                </div>
                <div className="h-12 bg-gray-950 rounded relative overflow-hidden">
                  {scenes.map((scene, index) => {
                    const prevDuration = scenes.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
                    const widthPx = scene.duration * 20
                    const leftPx = prevDuration * 20

                    return (
                      <div
                        key={scene.id}
                        onClick={() => setSelectedScene(scene.id)}
                        className={`absolute h-full cursor-pointer transition-all border-r border-gray-950 ${
                          selectedScene === scene.id ? 'bg-blue-600' : 'bg-blue-800 hover:bg-blue-700'
                        }`}
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}>
                        <div className="h-full flex items-center justify-center text-xs font-medium">
                          S{index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Audio Layer */}
              <div className="mb-1">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Music size={10} />
                  Scene Audio
                </div>
                <div className="h-8 bg-gray-950 rounded relative overflow-hidden">
                  {scenes.map((scene, index) => {
                    if (!scene.audio) return null
                    const prevDuration = scenes.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
                    const widthPx = scene.duration * 20
                    const leftPx = prevDuration * 20

                    return (
                      <div
                        key={scene.id}
                        className="absolute h-full bg-green-700 border-r border-gray-950"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}>
                        <div className="h-full flex items-center justify-center text-xs">
                          <Music size={10} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Voice-over Layer */}
              {voiceOver && (
                <div className="mb-1">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Mic size={10} />
                    Voice-over
                  </div>
                  <div className="h-8 bg-gray-950 rounded relative overflow-hidden">
                    <div
                      className="absolute h-full bg-purple-700"
                      style={{ left: 0, width: `${totalDuration * 20}px` }}>
                      <div className="h-full flex items-center justify-center text-xs">
                        <Mic size={10} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Background Audio Layer */}
              {backgroundAudio && (
                <div className="mb-1">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Speaker size={10} />
                    Background
                  </div>
                  <div className="h-8 bg-gray-950 rounded relative overflow-hidden">
                    <div
                      className="absolute h-full bg-orange-700"
                      style={{ left: 0, width: `${totalDuration * 20}px` }}>
                      <div className="h-full flex items-center justify-center text-xs">
                        <Speaker size={10} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Captions Layer */}
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Type size={10} />
                  Captions
                </div>
                <div className="h-8 bg-gray-950 rounded relative overflow-hidden">
                  {scenes.map((scene, index) => {
                    if (!scene.captions) return null
                    const prevDuration = scenes.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
                    const widthPx = scene.duration * 20
                    const leftPx = prevDuration * 20

                    return (
                      <div
                        key={scene.id}
                        className="absolute h-full bg-yellow-700 border-r border-gray-950"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}>
                        <div className="h-full flex items-center justify-center text-xs">
                          <Type size={10} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-2">
          {/* Scene Specific Controls */}
          {selectedSceneData && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Music size={12} />
                  <span>Scene {scenes.findIndex(s => s.id === selectedScene) + 1} Audio</span>
                </div>
                <input
                  type="text"
                  value={selectedSceneData.audio}
                  onChange={(e) => updateScene(selectedScene, 'audio', e.target.value)}
                  placeholder="Audio Prompt or URL..."
                  className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Type size={12} />
                  <span>Scene {scenes.findIndex(s => s.id === selectedScene) + 1} Captions</span>
                </div>
                <input
                  type="text"
                  value={selectedSceneData.captions}
                  onChange={(e) => updateScene(selectedScene, 'captions', e.target.value)}
                  placeholder="Caption Text..."
                  className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Global Audio Controls */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mic size={12} />
                <span>Voice-over (Global)</span>
              </div>
              <input
                type="text"
                value={voiceOver}
                onChange={(e) => setVoiceOver(e.target.value)}
                placeholder="Voice-over Prompt or URL..."
                className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Speaker size={12} />
                <span>Background Audio (Global)</span>
              </div>
              <input
                type="text"
                value={backgroundAudio}
                onChange={(e) => setBackgroundAudio(e.target.value)}
                placeholder="Background Music URL..."
                className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
