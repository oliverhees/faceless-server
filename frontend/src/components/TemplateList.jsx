import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Filter } from 'lucide-react'
import { templateAPI } from '../services/api'
import './TemplateList.css'

function TemplateList({ onCreateNew, onEditTemplate }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'built-in', 'community'
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadTemplates()
  }, [filter, categoryFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {}
      if (filter !== 'all') {
        filters.type = filter
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter
      }

      const data = await templateAPI.getAll(filters)
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load templates')
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId, event) => {
    event.stopPropagation()

    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await templateAPI.delete(templateId)
      loadTemplates()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete template')
    }
  }

  const handleEdit = (template, event) => {
    event.stopPropagation()
    onEditTemplate(template)
  }

  if (loading) {
    return (
      <div className="template-list-container">
        <div className="spinner"></div>
        <p>Loading templates...</p>
      </div>
    )
  }

  return (
    <div className="template-list-container">
      <div className="template-list-header">
        <div className="filters">
          <div className="filter-group">
            <Filter size={16} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Templates</option>
              <option value="built-in">Built-in</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div className="filter-group">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="product">Product Ads</option>
            </select>
          </div>
        </div>

        <button onClick={onCreateNew} className="create-btn">
          <Plus size={20} />
          Create New Template
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="templates-grid">
        {templates.length === 0 ? (
          <div className="no-templates">
            <p>No templates found</p>
            <button onClick={onCreateNew}>
              <Plus size={20} />
              Create your first template
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id || template.template_id}
              className="template-card"
              onClick={() => onEditTemplate(template)}
            >
              <div className="template-card-header">
                <h3>{template.name || template.template_name}</h3>
                <span className={`badge ${template.type || 'built-in'}`}>
                  {template.type || 'built-in'}
                </span>
              </div>

              <p className="template-description">
                {template.description || 'No description'}
              </p>

              <div className="template-meta">
                <span className="category">{template.category}</span>
                {template.renders_count !== undefined && (
                  <span className="renders">
                    <Play size={14} />
                    {template.renders_count} renders
                  </span>
                )}
              </div>

              <div className="template-actions">
                <button
                  className="action-btn edit"
                  onClick={(e) => handleEdit(template, e)}
                  title="Edit template"
                >
                  <Edit size={16} />
                </button>

                {template.type === 'community' && (
                  <button
                    className="action-btn delete"
                    onClick={(e) => handleDelete(template.id || template.template_id, e)}
                    title="Delete template"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TemplateList
