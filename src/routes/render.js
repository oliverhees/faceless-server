/**
 * Render Route
 * POST /render - Render video from template
 */

const express = require('express');
const router = express.Router();
const videoProcessor = require('../services/videoProcessor');
const logger = require('../utils/logger');
const { validateRenderRequest } = require('../utils/validator');

/**
 * POST /render
 * Render a video from template and variables
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request
    const validation = validateRenderRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.errors,
      });
    }

    const { template, variables, async = true } = validation.value;

    logger.info('Render request received', {
      template,
      async,
      variableCount: Object.keys(variables).length,
    });

    // Process video
    const result = await videoProcessor.processVideo(validation.value);

    // Response format depends on async mode
    if (async) {
      // Async mode: Return 202 Accepted with job ID
      res.status(202).json({
        success: true,
        job_id: result.job_id,
        status: result.status,
        status_url: `/status/${result.job_id}`,
        message: 'Video rendering started',
      });
    } else {
      // Sync mode: Return 200 OK with video URL
      res.status(200).json({
        success: true,
        job_id: result.job_id,
        status: result.status,
        video_url: result.video_url,
        message: 'Video rendered successfully',
      });
    }

    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res.statusCode, responseTime);
  } catch (error) {
    logger.logError(error, {
      endpoint: '/render',
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
