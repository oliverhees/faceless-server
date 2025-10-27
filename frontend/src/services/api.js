import axios from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY || 'your-api-key-here'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
})

// Template API
export const templateAPI = {
  // Get all templates (built-in + community)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    const response = await api.get(`/community-templates?${params}`)
    return response.data
  },

  // Get specific template
  get: async (templateId) => {
    const response = await api.get(`/community-templates/${templateId}`)
    return response.data
  },

  // Create new template
  create: async (templateData) => {
    const response = await api.post('/community-templates', templateData)
    return response.data
  },

  // Update template
  update: async (templateId, templateData) => {
    const response = await api.put(`/community-templates/${templateId}`, templateData)
    return response.data
  },

  // Delete template
  delete: async (templateId) => {
    const response = await api.delete(`/community-templates/${templateId}`)
    return response.data
  },

  // Get built-in templates
  getBuiltIn: async () => {
    const response = await api.get('/templates')
    return response.data
  },
}

// Render API
export const renderAPI = {
  // Render video from template
  render: async (renderData) => {
    const response = await api.post('/render', renderData)
    return response.data
  },

  // Get render status
  getStatus: async (jobId) => {
    const response = await api.get(`/status/${jobId}`)
    return response.data
  },
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
