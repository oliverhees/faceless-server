/**
 * Logger Module
 * Winston-based logging with daily rotation and multiple transports
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config/config');

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console log format (more readable for development)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'ffmpeg-video-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Daily rotating file for all logs
    new DailyRotateFile({
      filename: path.join(config.logging.dir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: logFormat,
    }),

    // Daily rotating file for errors only
    new DailyRotateFile({
      filename: path.join(config.logging.dir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: logFormat,
    }),
  ],
});

/**
 * Log stream for Morgan (HTTP request logging)
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Helper methods for specific log types
 */

// Log API request
logger.logRequest = (req, statusCode, responseTime) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

// Log FFmpeg command execution
logger.logFFmpegCommand = (jobId, command) => {
  logger.debug('FFmpeg Command', {
    jobId,
    command,
  });
};

// Log FFmpeg output
logger.logFFmpegOutput = (jobId, output) => {
  logger.debug('FFmpeg Output', {
    jobId,
    output: output.substring(0, 500), // Truncate long outputs
  });
};

// Log job lifecycle
logger.logJob = (jobId, status, meta = {}) => {
  logger.info('Job Status', {
    jobId,
    status,
    ...meta,
  });
};

// Log storage operations
logger.logStorage = (operation, filePath, meta = {}) => {
  logger.info('Storage Operation', {
    operation,
    filePath,
    ...meta,
  });
};

// Log errors with context
logger.logError = (error, context = {}) => {
  logger.error('Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

module.exports = logger;
