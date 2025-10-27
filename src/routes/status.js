/**
 * Status Route
 * GET /status/:job_id - Get job status
 */

const express = require('express');
const router = express.Router();
const videoProcessor = require('../services/videoProcessor');
const logger = require('../utils/logger');

/**
 * GET /status/:job_id
 * Get status of a rendering job
 */
router.get('/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;

    // Get job status
    const status = await videoProcessor.getJobStatus(job_id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        job_id,
      });
    }

    // Return status
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    logger.logError(error, {
      endpoint: '/status',
      job_id: req.params.job_id,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /status
 * Get overall statistics
 */
router.get('/', async (req, res) => {
  try {
    const stats = await videoProcessor.getStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/status' });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
