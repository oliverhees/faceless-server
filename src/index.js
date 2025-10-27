/**
 * FFmpeg Video API Server
 * Main entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const logger = require('./utils/logger');
const fileManager = require('./utils/fileManager');
const storage = require('./config/storage');
const { jobManager } = require('./services/jobManager');

// Import routes
const renderRoute = require('./routes/render');
const statusRoute = require('./routes/status');
const templatesRoute = require('./routes/templates');
const healthRoute = require('./routes/health');

// Create Express app
const app = express();

/**
 * Middleware Configuration
 */

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.url === '/health', // Skip health checks
  })
);

/**
 * API Key Authentication Middleware
 */
function authenticateApiKey(req, res, next) {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'X-API-Key header is required',
    });
  }

  if (apiKey !== config.apiKey) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid API key',
    });
  }

  next();
}

// Apply authentication to all routes
app.use(authenticateApiKey);

/**
 * Routes
 */

// Health check (no auth required)
app.use('/health', healthRoute);

// API routes
app.use('/render', renderRoute);
app.use('/status', statusRoute);
app.use('/templates', templatesRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'FFmpeg Video API',
    version: '1.0.0',
    description: 'Automated video rendering service',
    endpoints: {
      render: 'POST /render',
      status: 'GET /status/:job_id',
      templates: 'GET /templates',
      health: 'GET /health',
    },
    documentation: 'https://github.com/yourusername/ffmpeg-video-api',
  });
});

/**
 * Error Handling Middleware
 */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.url,
    body: req.body,
  });

  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : 'Something went wrong',
  });
});

/**
 * Server Initialization
 */

async function initializeServer() {
  try {
    logger.info('Initializing FFmpeg Video API...');

    // Initialize file manager
    await fileManager.init();
    logger.info('File manager initialized');

    // Initialize storage
    await storage.init();
    logger.info(`Storage initialized (type: ${storage.type})`);

    // Initialize job manager
    await jobManager.init();
    logger.info('Job manager initialized');

    // Start server
    const server = app.listen(config.port, config.host, () => {
      logger.info('FFmpeg Video API started', {
        port: config.port,
        host: config.host,
        env: config.env,
        storage: storage.type,
      });
      console.log(`\n🚀 FFmpeg Video API is running!`);
      console.log(`📍 Address: http://${config.host}:${config.port}`);
      console.log(`🔒 API Key: ${config.apiKey.substring(0, 10)}...`);
      console.log(`💾 Storage: ${storage.type}`);
      console.log(`\n📚 Endpoints:`);
      console.log(`   POST   /render`);
      console.log(`   GET    /status/:job_id`);
      console.log(`   GET    /templates`);
      console.log(`   GET    /health`);
      console.log(`\n✨ Ready to render videos!\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
  } catch (error) {
    logger.error('Failed to initialize server', { error: error.message });
    console.error('❌ Server initialization failed:', error.message);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
async function gracefulShutdown(server) {
  logger.info('Received shutdown signal, closing gracefully...');
  console.log('\n⏳ Shutting down gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close job manager connections
      await jobManager.close();
      logger.info('Job manager closed');

      // Cleanup old temp files
      await fileManager.cleanupOldJobs(24);
      logger.info('Temp files cleaned up');

      logger.info('Graceful shutdown completed');
      console.log('✅ Shutdown complete\n');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start the server
initializeServer();

module.exports = app;
