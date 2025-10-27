/**
 * Community Templates API Routes
 * User-created templates with credit system integration
 */

const express = require('express');
const router = express.Router();
const communityTemplateService = require('../services/communityTemplateService');
const webhookService = require('../services/webhookService');
const logger = require('../utils/logger');

/**
 * POST /community-templates
 * Create a new community template
 *
 * Request body:
 * {
 *   "template_name": "My Custom Template",
 *   "description": "Template description",
 *   "category": "tiktok",
 *   "variables": [...],
 *   "video_sources": [...],
 *   "audio_sources": [...],
 *   "output": {...}
 * }
 */
router.post('/', async (req, res) => {
  try {
    const apiKey = req.header('X-API-Key');

    // Check user credits and get user ID
    const creditCheck = await webhookService.checkCredits(apiKey);

    if (!creditCheck.success) {
      return res.status(402).json({
        success: false,
        error: 'Payment Required',
        message: 'Unable to verify credits',
      });
    }

    // Create template
    const result = await communityTemplateService.createTemplate(
      req.body,
      creditCheck.user_id
    );

    logger.info('Community template created via API', {
      template_id: result.template_id,
      user_id: creditCheck.user_id,
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to create community template', { error: error.message });
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message,
    });
  }
});

/**
 * GET /community-templates
 * List all templates (built-in + community)
 *
 * Query parameters:
 * - category: Filter by category
 * - type: Filter by type (built-in or community)
 * - user_id: Filter by user (own templates)
 */
router.get('/', async (req, res) => {
  try {
    const filters = {};

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.type) {
      filters.type = req.query.type;
    }

    // If filtering by user, verify the API key matches
    if (req.query.user_id) {
      const apiKey = req.header('X-API-Key');
      const creditCheck = await webhookService.checkCredits(apiKey);

      if (creditCheck.success && creditCheck.user_id === parseInt(req.query.user_id)) {
        filters.user_id = parseInt(req.query.user_id);
      } else {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only view your own templates',
        });
      }
    }

    const templates = await communityTemplateService.listTemplates(filters);

    res.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    logger.error('Failed to list templates', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve templates',
    });
  }
});

/**
 * GET /community-templates/:id
 * Get a specific template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await communityTemplateService.getTemplate(req.params.id);

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error('Failed to get template', {
      template_id: req.params.id,
      error: error.message,
    });

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve template',
    });
  }
});

/**
 * PUT /community-templates/:id
 * Update a template (only if user owns it)
 */
router.put('/:id', async (req, res) => {
  try {
    const apiKey = req.header('X-API-Key');

    // Check user credits and get user ID
    const creditCheck = await webhookService.checkCredits(apiKey);

    if (!creditCheck.success) {
      return res.status(402).json({
        success: false,
        error: 'Payment Required',
        message: 'Unable to verify user',
      });
    }

    // Update template (ownership check is done inside the service)
    const result = await communityTemplateService.updateTemplate(
      req.params.id,
      req.body,
      creditCheck.user_id
    );

    logger.info('Community template updated via API', {
      template_id: req.params.id,
      user_id: creditCheck.user_id,
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to update template', {
      template_id: req.params.id,
      error: error.message,
    });

    if (error.message.includes('only update your own')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message,
    });
  }
});

/**
 * DELETE /community-templates/:id
 * Delete a template (only if user owns it)
 */
router.delete('/:id', async (req, res) => {
  try {
    const apiKey = req.header('X-API-Key');

    // Check user credits and get user ID
    const creditCheck = await webhookService.checkCredits(apiKey);

    if (!creditCheck.success) {
      return res.status(402).json({
        success: false,
        error: 'Payment Required',
        message: 'Unable to verify user',
      });
    }

    // Delete template (ownership check is done inside the service)
    const result = await communityTemplateService.deleteTemplate(
      req.params.id,
      creditCheck.user_id
    );

    logger.info('Community template deleted via API', {
      template_id: req.params.id,
      user_id: creditCheck.user_id,
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to delete template', {
      template_id: req.params.id,
      error: error.message,
    });

    if (error.message.includes('only delete your own')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message,
    });
  }
});

module.exports = router;
