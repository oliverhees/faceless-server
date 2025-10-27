/**
 * Community Template Service
 * Manages user-created templates stored as JSON files
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { validateTemplate } = require('../utils/validator');
const webhookService = require('./webhookService');

/**
 * Community Template Service Class
 */
class CommunityTemplateService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.communityDir = path.join(this.templatesDir, 'community');
  }

  /**
   * Initialize community templates directory
   */
  async init() {
    try {
      await fs.mkdir(this.communityDir, { recursive: true });
      logger.info('Community templates directory initialized');
    } catch (error) {
      logger.error('Failed to initialize community templates directory', {
        error: error.message,
      });
    }
  }

  /**
   * Generate unique template ID
   * @returns {string} - Template ID (e.g., "tmpl_1730035200_a1b2c3")
   */
  generateTemplateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `tmpl_${timestamp}_${random}`;
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @param {number} userId - User ID from credit check
   * @returns {Promise<Object>} - { success, template_id }
   */
  async createTemplate(templateData, userId) {
    try {
      // Generate template ID
      const templateId = this.generateTemplateId();

      // Validate template structure
      const validation = validateTemplate(templateData);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      // Add metadata
      const template = {
        ...templateData,
        template_id: templateId,
        user_id: userId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // Save template to file
      const filePath = path.join(this.communityDir, `${templateId}.json`);
      await fs.writeFile(filePath, JSON.stringify(template, null, 2));

      logger.info('Template created', { template_id: templateId, user_id: userId });

      // Save metadata to NocoDB via webhook (non-blocking)
      webhookService.saveTemplateMetadata({
        template_id: templateId,
        user_id: userId,
        name: templateData.template_name,
        description: templateData.description || '',
        category: templateData.category || 'custom',
      }).catch((err) => {
        logger.warn('Failed to save template metadata to NocoDB', { error: err.message });
      });

      return {
        success: true,
        template_id: templateId,
        message: 'Template created successfully',
      };
    } catch (error) {
      logger.error('Failed to create template', { error: error.message });
      throw error;
    }
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} - Template object
   */
  async getTemplate(templateId) {
    try {
      // Check if it's a built-in template
      const builtInPath = path.join(this.templatesDir, `${templateId}.json`);
      const communityPath = path.join(this.communityDir, `${templateId}.json`);

      let filePath;
      try {
        await fs.access(communityPath);
        filePath = communityPath;
      } catch {
        await fs.access(builtInPath);
        filePath = builtInPath;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);

      return template;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template not found: ${templateId}`);
      }
      throw error;
    }
  }

  /**
   * List all templates (built-in + community)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of template metadata
   */
  async listTemplates(filters = {}) {
    try {
      const templates = [];

      // Get built-in templates
      const builtInFiles = await fs.readdir(this.templatesDir);
      for (const file of builtInFiles) {
        if (file.endsWith('.json') && file !== 'README.md') {
          try {
            const content = await fs.readFile(
              path.join(this.templatesDir, file),
              'utf-8'
            );
            const template = JSON.parse(content);
            templates.push({
              template_id: template.template_name,
              name: template.template_name,
              category: template.category,
              description: template.description || '',
              type: 'built-in',
              variables: template.variables,
            });
          } catch (err) {
            logger.warn('Failed to parse template', { file, error: err.message });
          }
        }
      }

      // Get community templates
      try {
        const communityFiles = await fs.readdir(this.communityDir);
        for (const file of communityFiles) {
          if (file.endsWith('.json')) {
            try {
              const content = await fs.readFile(
                path.join(this.communityDir, file),
                'utf-8'
              );
              const template = JSON.parse(content);
              templates.push({
                template_id: template.template_id || file.replace('.json', ''),
                name: template.template_name,
                category: template.category,
                description: template.description || '',
                type: 'community',
                user_id: template.user_id,
                created: template.created,
                variables: template.variables,
              });
            } catch (err) {
              logger.warn('Failed to parse community template', {
                file,
                error: err.message,
              });
            }
          }
        }
      } catch (err) {
        // Community dir might not exist yet
        logger.debug('Community templates directory not accessible', {
          error: err.message,
        });
      }

      // Apply filters
      let filtered = templates;
      if (filters.category) {
        filtered = filtered.filter((t) => t.category === filters.category);
      }
      if (filters.type) {
        filtered = filtered.filter((t) => t.type === filters.type);
      }
      if (filters.user_id) {
        filtered = filtered.filter((t) => t.user_id === filters.user_id);
      }

      return filtered;
    } catch (error) {
      logger.error('Failed to list templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Update template (only if user owns it)
   * @param {string} templateId - Template ID
   * @param {Object} updates - Updates to apply
   * @param {number} userId - User ID making the update
   * @returns {Promise<Object>} - { success, message }
   */
  async updateTemplate(templateId, updates, userId) {
    try {
      // Load existing template
      const filePath = path.join(this.communityDir, `${templateId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);

      // Check ownership
      if (template.user_id !== userId) {
        throw new Error('You can only update your own templates');
      }

      // Apply updates
      const updatedTemplate = {
        ...template,
        ...updates,
        template_id: templateId, // Preserve ID
        user_id: userId, // Preserve owner
        created: template.created, // Preserve created date
        updated: new Date().toISOString(),
      };

      // Validate
      const validation = validateTemplate(updatedTemplate);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      // Save
      await fs.writeFile(filePath, JSON.stringify(updatedTemplate, null, 2));

      logger.info('Template updated', { template_id: templateId, user_id: userId });

      return {
        success: true,
        message: 'Template updated successfully',
      };
    } catch (error) {
      logger.error('Failed to update template', {
        template_id: templateId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete template (only if user owns it)
   * @param {string} templateId - Template ID
   * @param {number} userId - User ID making the deletion
   * @returns {Promise<Object>} - { success, message }
   */
  async deleteTemplate(templateId, userId) {
    try {
      // Load template to check ownership
      const filePath = path.join(this.communityDir, `${templateId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);

      // Check ownership
      if (template.user_id !== userId) {
        throw new Error('You can only delete your own templates');
      }

      // Delete file
      await fs.unlink(filePath);

      logger.info('Template deleted', { template_id: templateId, user_id: userId });

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      logger.error('Failed to delete template', {
        template_id: templateId,
        error: error.message,
      });
      throw error;
    }
  }
}

// Create singleton instance
const communityTemplateService = new CommunityTemplateService();

module.exports = communityTemplateService;
