/**
 * Health Route
 * GET /health - Health check endpoint
 */

const express = require('express');
const router = express.Router();
const videoProcessor = require('../services/videoProcessor');
const storage = require('../config/storage');
const { jobManager } = require('../services/jobManager');
const logger = require('../utils/logger');

/**
 * GET /health
 * Check health of all services
 */
router.get('/', async (req, res) => {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {},
    };

    // Check FFmpeg
    try {
      const ffmpegAvailable = await videoProcessor.checkFFmpeg();
      checks.services.ffmpeg = {
        status: ffmpegAvailable ? 'ok' : 'unavailable',
      };
    } catch (error) {
      checks.services.ffmpeg = {
        status: 'error',
        error: error.message,
      };
    }

    // Check Storage
    try {
      const storageHealth = await storage.healthCheck();
      checks.services.storage = storageHealth;
    } catch (error) {
      checks.services.storage = {
        status: 'error',
        error: error.message,
      };
    }

    // Check Redis/Job Manager
    try {
      checks.services.job_manager = {
        status: jobManager.connected ? 'ok' : 'disconnected',
        type: jobManager.redisEnabled ? 'redis' : 'in-memory',
      };
    } catch (error) {
      checks.services.job_manager = {
        status: 'error',
        error: error.message,
      };
    }

    // Check active jobs
    try {
      const stats = await videoProcessor.getStatistics();
      checks.services.video_processor = {
        status: 'ok',
        active_jobs: stats.active,
        total_jobs: stats.total,
      };
    } catch (error) {
      checks.services.video_processor = {
        status: 'error',
        error: error.message,
      };
    }

    // Determine overall status
    const hasErrors = Object.values(checks.services).some(
      (service) => service.status === 'error' || service.status === 'unavailable'
    );

    if (hasErrors) {
      checks.status = 'degraded';
      res.status(503);
    } else {
      checks.status = 'healthy';
      res.status(200);
    }

    res.json(checks);
  } catch (error) {
    logger.logError(error, { endpoint: '/health' });

    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
    });
  }
});

module.exports = router;
