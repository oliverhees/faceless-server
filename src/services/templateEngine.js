/**
 * Template Engine
 * Loads and processes video templates with variable substitution
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const { validateTemplate, validateTemplateVariables } = require('../utils/validator');

/**
 * Template Engine Class
 */
class TemplateEngine {
  constructor() {
    this.templatesDir = config.templatesDir;
    this.templateCache = new Map();
  }

  /**
   * Load template from file
   * @param {string} templateName - Template name (without .json extension)
   * @returns {Promise<Object>} - Template object
   */
  async loadTemplate(templateName) {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        logger.debug('Template loaded from cache', { templateName });
        return this.templateCache.get(templateName);
      }

      // Load from file
      const templatePath = path.join(this.templatesDir, `${templateName}.json`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(templateContent);

      // Validate template structure
      const validation = validateTemplate(template);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      // Cache template
      this.templateCache.set(templateName, template);

      logger.info('Template loaded', { templateName });
      return template;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template not found: ${templateName}`);
      }
      logger.error('Failed to load template', {
        templateName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List all available templates
   * @returns {Promise<Array>} - Array of template names
   */
  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templates = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''));

      return templates;
    } catch (error) {
      logger.error('Failed to list templates', { error: error.message });
      return [];
    }
  }

  /**
   * Get template info (metadata without full structure)
   * @param {string} templateName - Template name
   * @returns {Promise<Object>} - Template metadata
   */
  async getTemplateInfo(templateName) {
    const template = await this.loadTemplate(templateName);

    return {
      template_name: template.template_name,
      category: template.category,
      variables: template.variables,
      output: template.structure.output,
    };
  }

  /**
   * Process template with variables
   * @param {string} templateName - Template name
   * @param {Object} variables - Variables to substitute
   * @param {Object} customConfig - Optional custom configuration overrides
   * @returns {Promise<Object>} - Processed template
   */
  async processTemplate(templateName, variables, customConfig = null) {
    // Load template
    const template = await this.loadTemplate(templateName);

    // Validate variables
    const validation = validateTemplateVariables(variables, template.variables);
    if (!validation.valid) {
      throw new Error(
        `Missing required variables: ${validation.missing.join(', ')}`
      );
    }

    // Clone template structure to avoid modifying cached version
    let processedStructure = JSON.parse(JSON.stringify(template.structure));

    // Replace variables in structure
    processedStructure = this.replaceVariables(processedStructure, variables);

    // Apply custom config overrides
    if (customConfig) {
      processedStructure = this.mergeConfig(processedStructure, customConfig);
    }

    logger.debug('Template processed', {
      templateName,
      variableCount: Object.keys(variables).length,
    });

    return {
      template_name: template.template_name,
      category: template.category,
      structure: processedStructure,
    };
  }

  /**
   * Replace variables in object recursively
   * @param {*} obj - Object to process
   * @param {Object} variables - Variables to substitute
   * @returns {*} - Processed object
   */
  replaceVariables(obj, variables) {
    if (typeof obj === 'string') {
      // Replace {{variable}} patterns
      return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        if (variables.hasOwnProperty(varName)) {
          return variables[varName];
        }
        logger.warn('Variable not found', { varName });
        return match; // Keep original if not found
      });
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceVariables(item, variables));
    } else if (obj !== null && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, variables);
      }
      return result;
    }

    return obj;
  }

  /**
   * Merge custom config with template config
   * @param {Object} templateConfig - Original template config
   * @param {Object} customConfig - Custom overrides
   * @returns {Object} - Merged config
   */
  mergeConfig(templateConfig, customConfig) {
    return this.deepMerge(templateConfig, customConfig);
  }

  /**
   * Deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} - Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key])
        ) {
          if (target[key] && typeof target[key] === 'object') {
            output[key] = this.deepMerge(target[key], source[key]);
          } else {
            output[key] = source[key];
          }
        } else {
          output[key] = source[key];
        }
      }
    }

    return output;
  }

  /**
   * Save template to file
   * @param {Object} template - Template object
   * @returns {Promise<boolean>} - Success status
   */
  async saveTemplate(template) {
    try {
      const validation = validateTemplate(template);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      const templatePath = path.join(
        this.templatesDir,
        `${template.template_name}.json`
      );
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

      // Clear cache for this template
      this.templateCache.delete(template.template_name);

      logger.info('Template saved', { templateName: template.template_name });
      return true;
    } catch (error) {
      logger.error('Failed to save template', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete template
   * @param {string} templateName - Template name
   * @returns {Promise<boolean>} - Success status
   */
  async deleteTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.json`);
      await fs.unlink(templatePath);

      // Clear cache
      this.templateCache.delete(templateName);

      logger.info('Template deleted', { templateName });
      return true;
    } catch (error) {
      logger.error('Failed to delete template', {
        templateName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    logger.info('Template cache cleared');
  }
}

// Create singleton instance
const templateEngine = new TemplateEngine();

module.exports = templateEngine;
