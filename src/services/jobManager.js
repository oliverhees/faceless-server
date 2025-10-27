/**
 * Job Manager
 * Manages job tracking and status using Redis or in-memory store
 */

const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Job Status Enum
 */
const JobStatus = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Job Manager Class
 */
class JobManager {
  constructor() {
    this.redisClient = null;
    this.redisEnabled = config.redis.enabled;
    this.inMemoryStore = new Map(); // Fallback if Redis disabled
    this.connected = false;
  }

  /**
   * Initialize Job Manager (connect to Redis)
   */
  async init() {
    if (!this.redisEnabled) {
      logger.info('Redis disabled, using in-memory job store');
      this.connected = true;
      return;
    }

    try {
      this.redisClient = redis.createClient({
        url: config.redis.url,
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis error', { error: err.message });
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected');
        this.connected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.warn('Redis connection failed, falling back to in-memory store', {
        error: error.message,
      });
      this.redisEnabled = false;
      this.connected = true;
    }
  }

  /**
   * Create new job
   * @param {Object} jobData - Job data
   * @returns {Promise<string>} - Job ID
   */
  async createJob(jobData) {
    const jobId = this.generateJobId();
    const timestamp = Date.now();

    const job = {
      job_id: jobId,
      status: JobStatus.QUEUED,
      created_at: timestamp,
      updated_at: timestamp,
      ...jobData,
    };

    await this.saveJob(jobId, job);
    logger.logJob(jobId, JobStatus.QUEUED, { template: jobData.template });

    return jobId;
  }

  /**
   * Update job status
   * @param {string} jobId - Job ID
   * @param {string} status - New status
   * @param {Object} data - Additional data to update
   * @returns {Promise<boolean>} - Success status
   */
  async updateJob(jobId, status, data = {}) {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        logger.warn('Job not found for update', { jobId });
        return false;
      }

      const updatedJob = {
        ...job,
        status,
        updated_at: Date.now(),
        ...data,
      };

      await this.saveJob(jobId, updatedJob);
      logger.logJob(jobId, status, data);

      return true;
    } catch (error) {
      logger.error('Failed to update job', { jobId, error: error.message });
      return false;
    }
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} - Job object or null
   */
  async getJob(jobId) {
    try {
      if (this.redisEnabled && this.redisClient) {
        const data = await this.redisClient.get(`job:${jobId}`);
        return data ? JSON.parse(data) : null;
      } else {
        return this.inMemoryStore.get(jobId) || null;
      }
    } catch (error) {
      logger.error('Failed to get job', { jobId, error: error.message });
      return null;
    }
  }

  /**
   * Save job to store
   * @param {string} jobId - Job ID
   * @param {Object} job - Job object
   * @returns {Promise<boolean>} - Success status
   */
  async saveJob(jobId, job) {
    try {
      if (this.redisEnabled && this.redisClient) {
        await this.redisClient.set(
          `job:${jobId}`,
          JSON.stringify(job),
          { EX: 86400 } // Expire after 24 hours
        );
      } else {
        this.inMemoryStore.set(jobId, job);
      }
      return true;
    } catch (error) {
      logger.error('Failed to save job', { jobId, error: error.message });
      return false;
    }
  }

  /**
   * Delete job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteJob(jobId) {
    try {
      if (this.redisEnabled && this.redisClient) {
        await this.redisClient.del(`job:${jobId}`);
      } else {
        this.inMemoryStore.delete(jobId);
      }
      logger.info('Job deleted', { jobId });
      return true;
    } catch (error) {
      logger.error('Failed to delete job', { jobId, error: error.message });
      return false;
    }
  }

  /**
   * Mark job as processing
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} - Success status
   */
  async startProcessing(jobId) {
    return this.updateJob(jobId, JobStatus.PROCESSING, {
      started_at: Date.now(),
    });
  }

  /**
   * Mark job as completed
   * @param {string} jobId - Job ID
   * @param {string} videoUrl - URL to completed video
   * @param {Object} meta - Additional metadata
   * @returns {Promise<boolean>} - Success status
   */
  async completeJob(jobId, videoUrl, meta = {}) {
    return this.updateJob(jobId, JobStatus.COMPLETED, {
      video_url: videoUrl,
      completed_at: Date.now(),
      ...meta,
    });
  }

  /**
   * Mark job as failed
   * @param {string} jobId - Job ID
   * @param {string} error - Error message
   * @returns {Promise<boolean>} - Success status
   */
  async failJob(jobId, error) {
    return this.updateJob(jobId, JobStatus.FAILED, {
      error,
      failed_at: Date.now(),
    });
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} - Job status object
   */
  async getJobStatus(jobId) {
    const job = await this.getJob(jobId);
    if (!job) {
      return null;
    }

    // Calculate duration if completed
    let duration = null;
    if (job.completed_at && job.started_at) {
      duration = Math.round((job.completed_at - job.started_at) / 1000);
    }

    return {
      job_id: job.job_id,
      status: job.status,
      created_at: job.created_at,
      updated_at: job.updated_at,
      video_url: job.video_url,
      error: job.error,
      duration,
      template: job.template,
    };
  }

  /**
   * List all jobs (limited)
   * @param {number} limit - Maximum number of jobs to return
   * @returns {Promise<Array>} - Array of jobs
   */
  async listJobs(limit = 50) {
    try {
      if (this.redisEnabled && this.redisClient) {
        const keys = await this.redisClient.keys('job:*');
        const jobs = [];

        for (const key of keys.slice(0, limit)) {
          const data = await this.redisClient.get(key);
          if (data) {
            jobs.push(JSON.parse(data));
          }
        }

        return jobs.sort((a, b) => b.created_at - a.created_at);
      } else {
        const jobs = Array.from(this.inMemoryStore.values());
        return jobs.sort((a, b) => b.created_at - a.created_at).slice(0, limit);
      }
    } catch (error) {
      logger.error('Failed to list jobs', { error: error.message });
      return [];
    }
  }

  /**
   * Get job statistics
   * @returns {Promise<Object>} - Statistics object
   */
  async getStatistics() {
    try {
      const jobs = await this.listJobs(1000);

      const stats = {
        total: jobs.length,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      for (const job of jobs) {
        stats[job.status] = (stats[job.status] || 0) + 1;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get statistics', { error: error.message });
      return { total: 0, queued: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * Generate unique job ID
   * @returns {string} - Job ID
   */
  generateJobId() {
    const timestamp = Date.now();
    const random = uuidv4().split('-')[0];
    return `job_${timestamp}_${random}`;
  }

  /**
   * Cleanup old jobs
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {Promise<number>} - Number of jobs cleaned up
   */
  async cleanup(maxAgeHours = 24) {
    try {
      const jobs = await this.listJobs(1000);
      const threshold = Date.now() - maxAgeHours * 60 * 60 * 1000;
      let cleaned = 0;

      for (const job of jobs) {
        if (job.created_at < threshold && job.status !== JobStatus.PROCESSING) {
          await this.deleteJob(job.job_id);
          cleaned++;
        }
      }

      logger.info('Job cleanup completed', { cleaned, threshold: `${maxAgeHours}h` });
      return cleaned;
    } catch (error) {
      logger.error('Job cleanup failed', { error: error.message });
      return 0;
    }
  }

  /**
   * Close connections
   */
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
      logger.info('Redis connection closed');
    }
  }
}

// Create singleton instance
const jobManager = new JobManager();

module.exports = {
  jobManager,
  JobStatus,
};
