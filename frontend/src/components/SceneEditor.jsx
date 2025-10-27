import { useState, useRef } from 'react'
import { Plus, Trash2, Music, Type, Play, Download, Mic, Speaker, ArrowLeft, Save, X, Code, Eye, Image, Link } from 'lucide-react'
import { templateAPI } from '../services/api'

export default function SceneEditor({ template, onBack }) {
  const [projectName, setProjectName] = useState(template?.template_name || 'New Video')
  const [scenes, setScenes] = useState(template?.scenes || [
    { id: 1, prompt: '', duration: 8, voiceOver: '', captions: '', transition: 'fade', referenceImage: '', useLastFrameAsReference: false }
  ])
  const [selectedScene, setSelectedScene] = useState(1)
  const [voiceOverMode, setVoiceOverMode] = useState(template?.voiceOverMode || 'global') // 'global' or 'scene'
  const [globalVoiceOver, setGlobalVoiceOver] = useState(template?.globalVoiceOver || '')
  const [backgroundAudio, setBackgroundAudio] = useState(template?.backgroundAudio || '')
  const [aspectRatio, setAspectRatio] = useState(template?.aspectRatio || '9:16') // '9:16' or '16:9'
  const [viewMode, setViewMode] = useState('visual') // 'visual' or 'json'
  const [jsonCode, setJsonCode] = useState('')
  const [jsonError, setJsonError] = useState(null)
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
    setScenes([...scenes, {
      id: newId,
      prompt: '',
      duration: 8,
      voiceOver: '',
      captions: '',
      transition: 'fade',
      referenceImage: '',
      useLastFrameAsReference: false
    }])
  }

  const toggleVoiceOverMode = () => {
    setVoiceOverMode(prev => prev === 'global' ? 'scene' : 'global')
  }

  const toggleAspectRatio = () => {
    setAspectRatio(prev => prev === '9:16' ? '16:9' : '9:16')
  }

  const getOutputDimensions = () => {
    return aspectRatio === '16:9'
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1920 }
  }

  const syncToJson = () => {
    const { width, height } = getOutputDimensions()
    const config = {
      template_name: projectName,
      voiceOverMode,
      aspectRatio,
      scenes: scenes.map((scene, index) => ({
        id: scene.id,
        order: index,
        prompt: scene.prompt,
        duration: scene.duration,
        voiceOver: voiceOverMode === 'scene' ? (scene.voiceOver || null) : null,
        captions: scene.captions || null,
        transition: index < scenes.length - 1 ? scene.transition : null,
        referenceImage: scene.referenceImage || null,
        useLastFrameAsReference: index > 0 ? (scene.useLastFrameAsReference || false) : false
      })),
      globalAudio: {
        voiceOver: voiceOverMode === 'global' ? (globalVoiceOver || null) : null,
        background: backgroundAudio || null
      },
      totalDuration,
      output: {
        width,
        height,
        fps: 30
      }
    }
    setJsonCode(JSON.stringify(config, null, 2))
  }

  const syncFromJson = () => {
    try {
      const config = JSON.parse(jsonCode)
      setProjectName(config.template_name || 'New Video')
      setVoiceOverMode(config.voiceOverMode || 'global')
      setAspectRatio(config.aspectRatio || '9:16')
      setGlobalVoiceOver(config.globalAudio?.voiceOver || '')
      setBackgroundAudio(config.globalAudio?.background || '')
      setScenes(config.scenes || [])
      setJsonError(null)
      setViewMode('visual')
    } catch (err) {
      setJsonError('Invalid JSON: ' + err.message)
    }
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
    const { width, height } = getOutputDimensions()
    const config = {
      template_name: projectName,
      voiceOverMode,
      aspectRatio,
      scenes: scenes.map((scene, index) => ({
        id: scene.id,
        order: index,
        prompt: scene.prompt,
        duration: scene.duration,
        voiceOver: voiceOverMode === 'scene' ? (scene.voiceOver || null) : null,
        captions: scene.captions || null,
        transition: index < scenes.length - 1 ? scene.transition : null,
        referenceImage: scene.referenceImage || null,
        useLastFrameAsReference: index > 0 ? (scene.useLastFrameAsReference || false) : false
      })),
      globalAudio: {
        voiceOver: voiceOverMode === 'global' ? (globalVoiceOver || null) : null,
        background: backgroundAudio || null
      },
      totalDuration,
      output: {
        width,
        height,
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

      const { width, height } = getOutputDimensions()
      const templateData = {
        template_name: projectName,
        description: `Scene-based video with ${scenes.length} scenes`,
        category: 'ai-video',
        voiceOverMode,
        aspectRatio,
        scenes,
        globalVoiceOver,
        backgroundAudio,
        output: {
          width,
          height,
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
        </div>

        {/* Center - View Mode, Aspect Ratio & Voice-Over Toggle */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-800 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'visual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Eye size={12} />
              Visual
            </button>
            <button
              onClick={() => { syncToJson(); setViewMode('json'); }}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Code size={12} />
              JSON
            </button>
          </div>

          {/* Aspect Ratio Toggle */}
          <button
            onClick={toggleAspectRatio}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs flex items-center gap-1.5 transition-colors">
            {aspectRatio === '9:16' ? '📱' : '🖥️'} {aspectRatio}
          </button>

          {/* Voice-Over Mode Toggle */}
          <button
            onClick={toggleVoiceOverMode}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs flex items-center gap-1.5 transition-colors">
            <Mic size={12} />
            Voice-Over: {voiceOverMode === 'global' ? 'Global' : 'Per Scene'}
          </button>
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

      {viewMode === 'json' ? (
        /* JSON Editor View */
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {jsonError && (
            <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-2 rounded text-sm mb-4">
              {jsonError}
            </div>
          )}
          <div className="flex-1 flex flex-col">
            <textarea
              value={jsonCode}
              onChange={(e) => setJsonCode(e.target.value)}
              className="flex-1 bg-gray-900 text-gray-100 font-mono text-sm p-4 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="JSON configuration..."
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={syncFromJson}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2 transition-colors">
                <Eye size={14} />
                Apply & Switch to Visual
              </button>
              <button
                onClick={syncToJson}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                Refresh from Visual
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Main Scene Area */}
      <div
        ref={scenesScrollRef}
        onScroll={handleScenesScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 #111827' }}>

        <div className="h-full flex items-center px-6 gap-3" style={{ minWidth: 'max-content' }}>
          {scenes.map((scene, index) => {
            const cardDimensions = aspectRatio === '16:9'
              ? { width: '400px', height: '225px' }
              : { width: '200px', height: '356px' }

            return (
            <div key={scene.id} className="flex items-center gap-3">
              {/* Scene Card */}
              <div
                onClick={() => setSelectedScene(scene.id)}
                className={`relative flex-shrink-0 cursor-pointer transition-all ${
                  selectedScene === scene.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:ring-1 ring-gray-700'
                }`}
                style={cardDimensions}>
                <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                  {/* Video Preview */}
                  <div className="h-2/3 bg-gradient-to-br from-purple-950 via-blue-950 to-pink-950 flex items-center justify-center relative">
                    {/* Reference Image Background if set */}
                    {scene.referenceImage && (
                      <div className="absolute inset-0 opacity-20">
                        <img src={scene.referenceImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="text-center relative z-10">
                      <Play size={32} className="mx-auto mb-2 opacity-40" />
                      <div className="text-xs opacity-60">Scene {index + 1}</div>
                      <div className="text-xs mt-1 opacity-40">{scene.duration}s</div>
                    </div>

                    {/* Indicators */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {scene.referenceImage && (
                        <div className="bg-blue-600 bg-opacity-90 p-1 rounded" title="Has reference image">
                          <Image size={10} />
                        </div>
                      )}
                      {scene.useLastFrameAsReference && index > 0 && (
                        <div className="bg-green-600 bg-opacity-90 p-1 rounded" title="Uses last frame from previous scene">
                          <Link size={10} />
                        </div>
                      )}
                    </div>

                    {selectedScene === scene.id && scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeScene(scene.id)
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors z-10">
                        <X size={12} />
                      </button>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 z-10">
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
            )
          })}
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

              {/* Scene Voice-Over Layer (only when mode is 'scene') */}
              {voiceOverMode === 'scene' && (
                <div className="mb-1">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Mic size={10} />
                    Scene Voice-Over
                  </div>
                  <div className="h-8 bg-gray-950 rounded relative overflow-hidden">
                    {scenes.map((scene, index) => {
                      if (!scene.voiceOver) return null
                      const prevDuration = scenes.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
                      const widthPx = scene.duration * 20
                      const leftPx = prevDuration * 20

                      return (
                        <div
                          key={scene.id}
                          className="absolute h-full bg-purple-700 border-r border-gray-950"
                          style={{ left: `${leftPx}px`, width: `${widthPx}px` }}>
                          <div className="h-full flex items-center justify-center text-xs">
                            <Mic size={10} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Global Voice-over Layer (only when mode is 'global') */}
              {voiceOverMode === 'global' && globalVoiceOver && (
                <div className="mb-1">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Mic size={10} />
                    Voice-over (Global)
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

              {/* Captions Layer */}
              <div className="mb-1">
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
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-2">
          {/* Scene Specific Controls */}
          {selectedSceneData && (
            <>
              {/* Reference Image & Last Frame Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Image size={12} />
                    <span>Scene {scenes.findIndex(s => s.id === selectedScene) + 1} Reference Image</span>
                  </div>
                  <input
                    type="text"
                    value={selectedSceneData.referenceImage || ''}
                    onChange={(e) => updateScene(selectedScene, 'referenceImage', e.target.value)}
                    placeholder="Image URL for AI generation..."
                    className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {scenes.findIndex(s => s.id === selectedScene) > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Link size={12} />
                      <span>Use Last Frame as Reference</span>
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-950 rounded cursor-pointer hover:bg-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedSceneData.useLastFrameAsReference || false}
                        onChange={(e) => updateScene(selectedScene, 'useLastFrameAsReference', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-300">Use previous scene's last frame</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Voice-Over & Captions */}
              <div className="grid grid-cols-2 gap-2">
                {voiceOverMode === 'scene' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Mic size={12} />
                      <span>Scene {scenes.findIndex(s => s.id === selectedScene) + 1} Voice-Over</span>
                    </div>
                    <input
                      type="text"
                      value={selectedSceneData.voiceOver || ''}
                      onChange={(e) => updateScene(selectedScene, 'voiceOver', e.target.value)}
                      placeholder="Voice-over Prompt or URL..."
                      className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}

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
                    className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Global Audio Controls */}
          <div className={`grid gap-2 pt-2 border-t border-gray-800 ${voiceOverMode === 'global' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {voiceOverMode === 'global' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Mic size={12} />
                  <span>Voice-over (Global)</span>
                </div>
                <input
                  type="text"
                  value={globalVoiceOver}
                  onChange={(e) => setGlobalVoiceOver(e.target.value)}
                  placeholder="Voice-over Prompt or URL..."
                  className="w-full bg-gray-950 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

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
        </>
      )}
    </div>
  )
}
