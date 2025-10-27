/**
 * Configuration Module
 * Loads and validates environment variables
 * Provides centralized configuration for the entire application
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

/**
 * Application Configuration
 * All configuration values are loaded from environment variables
 */
const config = {
  // Server Configuration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Security Configuration
  apiKey: process.env.API_KEY || 'default-api-key-change-in-production',

  // Storage Configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'r2', 's3', or 'local'
    makePublic: process.env.STORAGE_MAKE_PUBLIC === 'true',

    // Cloudflare R2 Configuration
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      bucket: process.env.R2_BUCKET,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      publicUrl: process.env.R2_PUBLIC_URL,
    },

    // AWS S3 Configuration
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },

    // Local Storage Configuration
    local: {
      storagePath: process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../../storage/uploads'),
      baseUrl: process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/files',
    },
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED !== 'false',
  },

  // FFmpeg Configuration
  ffmpeg: {
    threads: parseInt(process.env.FFMPEG_THREADS, 10) || 4,
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 3,
    tempDir: process.env.TEMP_DIR || '/tmp/ffmpeg-api',
    timeout: parseInt(process.env.FFMPEG_TIMEOUT, 10) || 600, // 10 minutes
    downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT, 10) || 60, // 1 minute
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  },

  // Rate Limiting Configuration
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  },

  // Webhook Configuration (Optional)
  webhook: {
    url: process.env.WEBHOOK_URL,
    secret: process.env.WEBHOOK_SECRET,
  },

  // Templates Directory
  templatesDir: path.join(__dirname, '../templates'),
};

/**
 * Validate critical configuration
 * Throws error if required configuration is missing
 */
function validateConfig() {
  const errors = [];

  // Validate storage configuration based on type
  if (config.storage.type === 'r2') {
    if (!config.storage.r2.accountId) errors.push('R2_ACCOUNT_ID is required when STORAGE_TYPE=r2');
    if (!config.storage.r2.bucket) errors.push('R2_BUCKET is required when STORAGE_TYPE=r2');
    if (!config.storage.r2.accessKeyId) errors.push('R2_ACCESS_KEY_ID is required when STORAGE_TYPE=r2');
    if (!config.storage.r2.secretAccessKey) errors.push('R2_SECRET_ACCESS_KEY is required when STORAGE_TYPE=r2');
  } else if (config.storage.type === 's3') {
    if (!config.storage.s3.bucket) errors.push('S3_BUCKET is required when STORAGE_TYPE=s3');
    if (!config.storage.s3.accessKeyId) errors.push('S3_ACCESS_KEY_ID is required when STORAGE_TYPE=s3');
    if (!config.storage.s3.secretAccessKey) errors.push('S3_SECRET_ACCESS_KEY is required when STORAGE_TYPE=s3');
  }

  // Warn about default API key in production
  if (config.env === 'production' && config.apiKey === 'default-api-key-change-in-production') {
    errors.push('API_KEY must be changed in production environment');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Validate configuration on load
try {
  validateConfig();
} catch (error) {
  console.error('Configuration Error:', error.message);
  if (config.env === 'production') {
    process.exit(1);
  }
}

module.exports = config;
