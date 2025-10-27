/**
 * Templates Route
 * GET /templates - List templates
 * GET /templates/:name - Get template info
 */

const express = require('express');
const router = express.Router();
const templateEngine = require('../services/templateEngine');
const logger = require('../utils/logger');

/**
 * GET /templates
 * List all available templates
 */
router.get('/', async (req, res) => {
  try {
    const templates = await templateEngine.listTemplates();

    res.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/templates' });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /templates/:name
 * Get information about a specific template
 */
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const templateInfo = await templateEngine.getTemplateInfo(name);

    res.json({
      success: true,
      template: templateInfo,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        template: req.params.name,
      });
    }

    logger.logError(error, {
      endpoint: '/templates/:name',
      template: req.params.name,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
