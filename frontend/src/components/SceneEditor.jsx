import { useState, useRef } from 'react'
import { Plus, Trash2, Music, Type, Play, Download, Mic, Speaker, ArrowLeft, Save, X, Code, Eye, Image, Link, Sparkles, Settings, RefreshCw, Edit3 } from 'lucide-react'
import { templateAPI } from '../services/api'

export default function SceneEditor({ template, onBack }) {
  // Check if we should start with generator or timeline
  const hasTemplateData = template && template.scenes && template.scenes.length > 0

  const [projectName, setProjectName] = useState(template?.template_name || 'New Video')
  const [scenes, setScenes] = useState(template?.scenes || [])
  const [selectedScene, setSelectedScene] = useState(template?.scenes?.[0]?.id || 1)
  const [voiceOverMode, setVoiceOverMode] = useState(template?.voiceOverMode || 'global')
  const [globalVoiceOver, setGlobalVoiceOver] = useState(template?.globalVoiceOver || '')
  const [backgroundAudio, setBackgroundAudio] = useState(template?.backgroundAudio || '')
  const [aspectRatio, setAspectRatio] = useState(template?.aspectRatio || '9:16')
  const [viewMode, setViewMode] = useState(hasTemplateData ? 'timeline' : 'generator') // 'generator', 'review', 'timeline', 'sceneDetail', 'json'
  const [jsonCode, setJsonCode] = useState('')
  const [jsonError, setJsonError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Generator states
  const [generatorPrompt, setGeneratorPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState(null)

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

  const openSceneDetail = (sceneId) => {
    setSelectedScene(sceneId)
    setViewMode('sceneDetail')
  }

  const backToTimeline = () => {
    setViewMode('timeline')
  }

  // Mock AI Video Generator
  const generateVideoWithAI = async (userPrompt) => {
    setGenerating(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const prompt = userPrompt.toLowerCase()
    let result = null

    // Scenario 1: Ring/Doorbell Camera Videos
    if (prompt.includes('ring') || prompt.includes('doorbell') || prompt.includes('camera')) {
      const sceneCount = parseInt(prompt.match(/\d+/)?.[0]) || 3
      result = {
        projectName: 'Ring Camera Compilation',
        voiceOverMode: 'global',
        globalVoiceOver: '',
        backgroundAudio: 'Suspenseful music, mysterious atmosphere',
        aspectRatio: '9:16',
        scenes: Array.from({ length: sceneCount }, (_, i) => ({
          id: i + 1,
          prompt: prompt.includes('tornado') && prompt.includes('monkey')
            ? `Ring doorbell camera footage showing a tornado approaching in the distance, debris flying including a monkey being carried by the wind, realistic security camera style, timestamp visible`
            : `Ring doorbell camera footage showing unusual activity at front door, security camera perspective, timestamp visible, scene ${i + 1}`,
          duration: 8,
          voiceOver: '',
          captions: `Ring Video ${i + 1}`,
          transition: 'fade',
          referenceImage: '',
          useLastFrameAsReference: false
        }))
      }
    }
    // Scenario 2: Story with Voice-Over
    else if (prompt.includes('story') || prompt.includes('erzähl') || prompt.includes('boy') || prompt.includes('junge')) {
      const durationMatch = prompt.match(/(\d+)\s*(minute|min|sekunden|sec)/i)
      const totalDuration = durationMatch ? parseInt(durationMatch[1]) * 60 : 60
      const sceneCount = Math.ceil(totalDuration / 10)

      result = {
        projectName: 'Boy Searching for Dragons',
        voiceOverMode: 'scene',
        globalVoiceOver: '',
        backgroundAudio: 'Epic fantasy orchestral music, mysterious and adventurous',
        aspectRatio: '16:9',
        scenes: Array.from({ length: sceneCount }, (_, i) => {
          const storyParts = [
            { prompt: 'A young boy with a backpack walking into a dense, mystical forest, golden sunlight filtering through trees', voice: 'Once upon a time, there was a brave young boy who dreamed of finding dragons.' },
            { prompt: 'Boy looking at ancient dragon claw marks on a massive tree trunk, expression of wonder and excitement', voice: 'He searched deep in the forest, following ancient signs and mysterious clues.' },
            { prompt: 'Boy discovering a hidden cave entrance covered in vines, magical glow coming from inside', voice: 'Until one day, he found something extraordinary...' },
            { prompt: 'Inside the cave, silhouettes of dragon wings visible in the shadows, boy approaching cautiously', voice: 'There, in the depths of the cave, his dreams were about to come true.' },
            { prompt: 'Close-up of boy\'s face illuminated by dragon fire glow, awe and happiness in his eyes', voice: 'And he learned that some dreams are worth chasing.' }
          ]
          const part = storyParts[i % storyParts.length]
          return {
            id: i + 1,
            prompt: part.prompt,
            duration: 10,
            voiceOver: part.voice,
            captions: '',
            transition: i === 0 ? 'fade' : 'dissolve',
            referenceImage: '',
            useLastFrameAsReference: i > 0
          }
        }).slice(0, sceneCount)
      }
    }
    // Scenario 3: Top Facts / Listicle Format
    else if (prompt.includes('top') || prompt.includes('fakt') || prompt.includes('fact') || prompt.includes('krass')) {
      const countMatch = prompt.match(/(\d+)/)
      const factCount = countMatch ? parseInt(countMatch[1]) : 5

      const topic = prompt.includes('tiefsee') || prompt.includes('underwater') || prompt.includes('ocean')
        ? 'deep sea creatures'
        : 'amazing facts'

      result = {
        projectName: `Top ${factCount} ${topic}`,
        voiceOverMode: 'scene',
        globalVoiceOver: '',
        backgroundAudio: 'Upbeat background music, energetic and engaging',
        aspectRatio: '9:16',
        scenes: Array.from({ length: factCount }, (_, i) => {
          const deepSeaFacts = [
            { creature: 'Anglerfish', fact: 'The anglerfish uses a bioluminescent lure growing from its head to attract prey in complete darkness.', prompt: 'Creepy anglerfish in deep ocean darkness, glowing lure visible, dramatic underwater cinematography' },
            { creature: 'Giant Squid', fact: 'Giant squids have eyes the size of dinner plates - the largest eyes in the animal kingdom!', prompt: 'Massive giant squid swimming in deep water, enormous eye close-up, mysterious deep sea environment' },
            { creature: 'Vampire Squid', fact: 'Despite its name, the vampire squid is actually harmless and feeds on marine snow and detritus.', prompt: 'Vampire squid floating in dark waters, tentacles spread showing defensive posture, red bioluminescent display' },
            { creature: 'Barreleye Fish', fact: 'The barreleye fish has a transparent head that allows it to look upward through its skull!', prompt: 'Barreleye fish with transparent dome head, green eyes visible inside, swimming upward, surreal deep sea footage' },
            { creature: 'Gulper Eel', fact: 'The gulper eel can swallow prey larger than itself thanks to its massive, expandable mouth.', prompt: 'Gulper eel with enormous mouth wide open, bioluminescent tail tip, swimming in pitch black waters' }
          ]

          const fact = deepSeaFacts[i % deepSeaFacts.length]
          return {
            id: i + 1,
            prompt: fact.prompt,
            duration: 12,
            voiceOver: `Number ${i + 1}: ${fact.creature}. ${fact.fact}`,
            captions: `#${i + 1} ${fact.creature}`,
            transition: 'fade',
            referenceImage: '',
            useLastFrameAsReference: false
          }
        })
      }
    }
    // Default fallback
    else {
      result = {
        projectName: 'AI Generated Video',
        voiceOverMode: 'global',
        globalVoiceOver: 'A captivating story unfolds...',
        backgroundAudio: 'Cinematic background music',
        aspectRatio: '16:9',
        scenes: [
          {
            id: 1,
            prompt: userPrompt || 'Beautiful cinematic scene',
            duration: 10,
            voiceOver: '',
            captions: '',
            transition: 'fade',
            referenceImage: '',
            useLastFrameAsReference: false
          }
        ]
      }
    }

    setGenerating(false)
    setGeneratedResult(result)
    setViewMode('review')
  }

  const loadGeneratedScenes = () => {
    if (!generatedResult) return

    setProjectName(generatedResult.projectName)
    setVoiceOverMode(generatedResult.voiceOverMode)
    setGlobalVoiceOver(generatedResult.globalVoiceOver || '')
    setBackgroundAudio(generatedResult.backgroundAudio || '')
    setAspectRatio(generatedResult.aspectRatio || '9:16')
    setScenes(generatedResult.scenes)
    setSelectedScene(generatedResult.scenes[0]?.id || 1)
    setViewMode('timeline')
    setGeneratedResult(null)
    setGeneratorPrompt('')
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
      setViewMode('timeline')
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
              onClick={() => setViewMode('generator')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'generator' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Sparkles size={12} />
              AI Generator
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'timeline' || viewMode === 'sceneDetail' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Eye size={12} />
              Timeline
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

      {viewMode === 'generator' ? (
        /* AI Generator Start Screen - Modern Full-Screen Design */
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Main Content Card */}
          <div className="relative z-10 w-full max-w-4xl">
            {/* Glassmorphism Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="text-center pt-12 pb-8 px-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6 animate-pulse">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  AI Video Generator
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Describe your vision and watch AI transform it into a complete video project with scenes, voice-overs, and transitions
                </p>
              </div>

              {/* Main Input Area */}
              <div className="px-8 pb-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    What video do you want to create?
                  </label>
                  <textarea
                    value={generatorPrompt}
                    onChange={(e) => setGeneratorPrompt(e.target.value)}
                    placeholder="Examples:&#10;• 3 Ring doorbell camera videos showing a tornado with flying monkeys&#10;• A 1 minute story about a boy searching for dragons in the forest&#10;• Top 5 creepiest deep sea creatures with facts&#10;• 10 second product showcase for a smart watch"
                    className="w-full h-48 bg-black/40 text-white text-lg p-5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-500 backdrop-blur-sm transition-all"
                    disabled={generating}
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => generateVideoWithAI(generatorPrompt)}
                  disabled={generating || !generatorPrompt.trim()}
                  className="w-full mt-6 px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-xl font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-purple-500/50">
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Creating your video...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      <span>Generate Video with AI</span>
                    </>
                  )}
                </button>

                {/* Example Prompts */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-3">Quick examples to get started:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '3 Ring videos with tornado and monkeys',
                      'Story: boy searching for dragons, 1 minute',
                      'Top 5 deep sea creature facts',
                      'Product showcase for smartwatch'
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setGeneratorPrompt(example)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all border border-white/10 hover:border-purple-500/50"
                        disabled={generating}>
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center mt-6 text-sm text-gray-400">
              <p>Powered by AI • Instant scene generation • Professional video structure</p>
            </div>
          </div>
        </div>
      ) : viewMode === 'review' ? (
        /* Review & Edit Screen - NEW */
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/10 to-gray-950">
          {generatedResult && (
            <>
              {/* Header with Editable Prompt */}
              <div className="flex-shrink-0 p-6 bg-gray-900/50 border-b border-gray-800">
                <div className="max-w-6xl mx-auto space-y-4">
                  <div className="flex items-center gap-3 text-green-400 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                      ✓
                    </div>
                    <h2 className="text-2xl font-bold">Video Generated Successfully!</h2>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Edit3 size={16} />
                      <span>Original Prompt (editable)</span>
                    </div>
                    <textarea
                      value={generatorPrompt}
                      onChange={(e) => setGeneratorPrompt(e.target.value)}
                      className="w-full h-24 bg-gray-950 text-gray-100 text-sm p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Edit your original prompt and regenerate..."
                    />
                  </div>
                </div>
              </div>

              {/* Settings & Scene Preview */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Settings Panel */}
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings size={20} className="text-purple-400" />
                      <h3 className="text-lg font-semibold">Project Settings</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Project Name</div>
                        <div className="text-white font-medium">{generatedResult.projectName}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Scenes</div>
                        <div className="text-white font-medium">{generatedResult.scenes.length} scenes</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Aspect Ratio</div>
                        <div className="text-white font-medium">{generatedResult.aspectRatio}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Voice-Over</div>
                        <div className="text-white font-medium">{generatedResult.voiceOverMode === 'global' ? 'Global' : 'Per Scene'}</div>
                      </div>
                    </div>
                    {generatedResult.backgroundAudio && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="text-gray-500 text-sm mb-1">Background Music</div>
                        <div className="text-white text-sm">{generatedResult.backgroundAudio}</div>
                      </div>
                    )}
                  </div>

                  {/* Scene Preview Grid */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Generated Scenes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedResult.scenes.map((scene, i) => (
                        <div key={scene.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="text-sm text-gray-300 leading-relaxed">{scene.prompt}</div>
                              {scene.voiceOver && (
                                <div className="text-xs text-purple-400 flex items-center gap-1 bg-purple-950/30 px-2 py-1 rounded">
                                  <Mic size={12} />
                                  <span>{scene.voiceOver}</span>
                                </div>
                              )}
                              {scene.captions && (
                                <div className="text-xs text-yellow-400 flex items-center gap-1 bg-yellow-950/30 px-2 py-1 rounded">
                                  <Type size={12} />
                                  <span>{scene.captions}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{scene.duration}s</span>
                                {scene.transition && <span>→ {scene.transition}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 p-6">
                <div className="max-w-6xl mx-auto flex gap-4">
                  <button
                    onClick={() => setViewMode('generator')}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <ArrowLeft size={18} />
                    Back to Generator
                  </button>
                  <button
                    onClick={() => {
                      generateVideoWithAI(generatorPrompt)
                    }}
                    disabled={generating}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
                    {generating ? 'Regenerating...' : 'Regenerate with Changes'}
                  </button>
                  <button
                    onClick={loadGeneratedScenes}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg">
                    <Eye size={18} />
                    Continue to Timeline Editor
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : viewMode === 'json' ? (
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
                Apply & Switch to Timeline
              </button>
              <button
                onClick={syncToJson}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                Refresh from Visual
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'sceneDetail' ? (
        /* Scene Detail View */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-800">
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={backToTimeline}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                <ArrowLeft size={16} />
                Back to Timeline
              </button>

              {/* Scene Title */}
              <div>
                <h2 className="text-2xl font-bold">Scene {scenes.findIndex(s => s.id === selectedScene) + 1}</h2>
                <p className="text-sm text-gray-400 mt-1">Configure your scene settings</p>
              </div>

              {selectedSceneData && (
                <>
                  {/* Prompt */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Type size={16} />
                      Video Prompt
                    </label>
                    <textarea
                      value={selectedSceneData.prompt}
                      onChange={(e) => updateScene(selectedScene, 'prompt', e.target.value)}
                      className="w-full bg-gray-900 text-gray-100 text-sm p-3 rounded border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe what should happen in this scene..."
                      rows={4}
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Play size={16} />
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={selectedSceneData.duration}
                      onChange={(e) => updateScene(selectedScene, 'duration', parseInt(e.target.value) || 8)}
                      className="w-full bg-gray-900 px-3 py-2 rounded text-sm border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="15"
                    />
                  </div>

                  {/* Reference Image */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Image size={16} />
                      Reference Image
                    </label>
                    <input
                      type="text"
                      value={selectedSceneData.referenceImage || ''}
                      onChange={(e) => updateScene(selectedScene, 'referenceImage', e.target.value)}
                      placeholder="Image URL for AI generation..."
                      className="w-full bg-gray-900 px-3 py-2 rounded text-sm border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Use Last Frame Toggle */}
                  {scenes.findIndex(s => s.id === selectedScene) > 0 && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Link size={16} />
                        Frame Continuity
                      </label>
                      <label className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800">
                        <input
                          type="checkbox"
                          checked={selectedSceneData.useLastFrameAsReference || false}
                          onChange={(e) => updateScene(selectedScene, 'useLastFrameAsReference', e.target.checked)}
                          className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm text-gray-300">Use previous scene's last frame</div>
                          <div className="text-xs text-gray-500">Creates seamless transitions between scenes</div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Voice-Over (if scene mode) */}
                  {voiceOverMode === 'scene' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Mic size={16} />
                        Voice-Over
                      </label>
                      <input
                        type="text"
                        value={selectedSceneData.voiceOver || ''}
                        onChange={(e) => updateScene(selectedScene, 'voiceOver', e.target.value)}
                        placeholder="Voice-over prompt or URL..."
                        className="w-full bg-gray-900 px-3 py-2 rounded text-sm border border-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* Captions */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Type size={16} />
                      Captions
                    </label>
                    <input
                      type="text"
                      value={selectedSceneData.captions}
                      onChange={(e) => updateScene(selectedScene, 'captions', e.target.value)}
                      placeholder="Caption text..."
                      className="w-full bg-gray-900 px-3 py-2 rounded text-sm border border-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  {/* Transition (if not last scene) */}
                  {scenes.findIndex(s => s.id === selectedScene) < scenes.length - 1 && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        Transition to Next Scene
                      </label>
                      <select
                        value={selectedSceneData.transition}
                        onChange={(e) => updateTransition(selectedScene, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        {transitionTypes.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 p-6 flex items-center justify-center bg-gray-900">
            {selectedSceneData && (
              <div className="relative" style={aspectRatio === '16:9' ? { width: '640px', height: '360px' } : { width: '360px', height: '640px' }}>
                <div className="w-full h-full bg-gradient-to-br from-purple-950 via-blue-950 to-pink-950 rounded-lg overflow-hidden border-2 border-gray-800 flex items-center justify-center relative">
                  {/* Reference Image Background */}
                  {selectedSceneData.referenceImage && (
                    <div className="absolute inset-0 opacity-30">
                      <img src={selectedSceneData.referenceImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Scene Info Overlay */}
                  <div className="text-center relative z-10">
                    <Play size={64} className="mx-auto mb-4 opacity-40" />
                    <div className="text-lg opacity-60">Scene {scenes.findIndex(s => s.id === selectedScene) + 1}</div>
                    <div className="text-sm mt-2 opacity-40">{selectedSceneData.duration}s</div>
                  </div>

                  {/* Indicators */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {selectedSceneData.referenceImage && (
                      <div className="bg-blue-600 bg-opacity-90 px-3 py-1.5 rounded flex items-center gap-1.5">
                        <Image size={14} />
                        <span className="text-xs">Reference Image</span>
                      </div>
                    )}
                    {selectedSceneData.useLastFrameAsReference && scenes.findIndex(s => s.id === selectedScene) > 0 && (
                      <div className="bg-green-600 bg-opacity-90 px-3 py-1.5 rounded flex items-center gap-1.5">
                        <Link size={14} />
                        <span className="text-xs">Last Frame</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Preview Below */}
                {selectedSceneData.prompt && (
                  <div className="mt-4 p-4 bg-gray-950 rounded border border-gray-800">
                    <div className="text-xs text-gray-500 mb-1">Prompt:</div>
                    <div className="text-sm text-gray-300">{selectedSceneData.prompt}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
      {/* Main Scene Area - Timeline View */}
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
                onClick={() => openSceneDetail(scene.id)}
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
