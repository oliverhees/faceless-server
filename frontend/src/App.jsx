import { useState } from 'react'
import TemplateBuilder from './components/TemplateBuilder'
import TemplateList from './components/TemplateList'
import './App.css'

function App() {
  const [view, setView] = useState('list') // 'list' or 'builder'
  const [editingTemplate, setEditingTemplate] = useState(null)

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setView('builder')
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setView('builder')
  }

  const handleBackToList = () => {
    setView('list')
    setEditingTemplate(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 FFmpeg Template Builder</h1>
        <p>Create custom video templates visually</p>
      </header>

      {view === 'list' ? (
        <TemplateList
          onCreateNew={handleCreateNew}
          onEditTemplate={handleEditTemplate}
        />
      ) : (
        <TemplateBuilder
          template={editingTemplate}
          onBack={handleBackToList}
        />
      )}
    </div>
  )
}

export default App
