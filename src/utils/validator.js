/**
 * Request Validator Module
 * Uses Joi for schema validation
 */

const Joi = require('joi');

/**
 * Schema for render request
 */
const renderRequestSchema = Joi.object({
  template: Joi.string()
    .required()
    .description('Template name (e.g., "tiktok_animal_facts")'),

  variables: Joi.object()
    .required()
    .description('Template variables as key-value pairs'),

  async: Joi.boolean()
    .default(true)
    .description('Whether to process asynchronously'),

  custom_config: Joi.object()
    .optional()
    .description('Custom configuration to override template defaults'),

  webhook_url: Joi.string()
    .uri()
    .optional()
    .description('URL to send completion webhook'),
});

/**
 * Schema for batch render request
 */
const batchRenderRequestSchema = Joi.object({
  template: Joi.string()
    .required()
    .description('Template name for all renders'),

  renders: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        variables: Joi.object().required(),
        custom_config: Joi.object().optional(),
      })
    )
    .min(1)
    .max(10)
    .required()
    .description('Array of render configurations'),

  webhook_url: Joi.string()
    .uri()
    .optional()
    .description('URL to send completion webhook'),
});

/**
 * Schema for template creation/update
 */
const templateSchema = Joi.object({
  template_name: Joi.string()
    .required()
    .pattern(/^[a-z0-9_-]+$/)
    .description('Template identifier (lowercase, numbers, underscore, dash only)'),

  category: Joi.string()
    .required()
    .description('Template category (e.g., "tiktok", "youtube", "instagram")'),

  variables: Joi.array()
    .items(Joi.string())
    .required()
    .description('List of required variable names'),

  structure: Joi.object()
    .required()
    .description('Template structure definition'),
});

/**
 * Validate render request
 * @param {Object} body - Request body
 * @returns {Object} - { valid, errors, value }
 */
function validateRenderRequest(body) {
  const { error, value } = renderRequestSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    valid: !error,
    errors: error ? error.details.map((d) => d.message) : null,
    value,
  };
}

/**
 * Validate batch render request
 * @param {Object} body - Request body
 * @returns {Object} - { valid, errors, value }
 */
function validateBatchRenderRequest(body) {
  const { error, value } = batchRenderRequestSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    valid: !error,
    errors: error ? error.details.map((d) => d.message) : null,
    value,
  };
}

/**
 * Validate template
 * @param {Object} template - Template object
 * @returns {Object} - { valid, errors, value }
 */
function validateTemplate(template) {
  const { error, value } = templateSchema.validate(template, {
    abortEarly: false,
    stripUnknown: false,
  });

  return {
    valid: !error,
    errors: error ? error.details.map((d) => d.message) : null,
    value,
  };
}

/**
 * Validate template variables against required variables
 * @param {Object} providedVariables - Variables provided in request
 * @param {Array} requiredVariables - Required variables from template
 * @returns {Object} - { valid, missing }
 */
function validateTemplateVariables(providedVariables, requiredVariables) {
  const providedKeys = Object.keys(providedVariables);
  const missing = requiredVariables.filter((v) => !providedKeys.includes(v));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize filename for safe filesystem operations
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Valid or not
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate video resolution format
 * @param {string} resolution - Resolution string (e.g., "1920x1080")
 * @returns {boolean} - Valid or not
 */
function isValidResolution(resolution) {
  const pattern = /^\d{3,4}x\d{3,4}$/;
  return pattern.test(resolution);
}

/**
 * Parse resolution string to width and height
 * @param {string} resolution - Resolution string (e.g., "1920x1080")
 * @returns {Object} - { width, height }
 */
function parseResolution(resolution) {
  const [width, height] = resolution.split('x').map(Number);
  return { width, height };
}

module.exports = {
  validateRenderRequest,
  validateBatchRenderRequest,
  validateTemplate,
  validateTemplateVariables,
  sanitizeFilename,
  isValidUrl,
  isValidResolution,
  parseResolution,
};
