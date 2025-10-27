/**
 * Video Processor Service
 * Main orchestrator for video rendering pipeline
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const fileManager = require('../utils/fileManager');
const storage = require('../config/storage');
const templateEngine = require('./templateEngine');
const { buildFFmpegCommand } = require('./ffmpegBuilder');
const { jobManager, JobStatus } = require('./jobManager');
const webhookService = require('./webhookService');

const execAsync = promisify(exec);

/**
 * Video Processor Class
 */
class VideoProcessor {
  constructor() {
    this.activeJobs = new Map();
    this.maxConcurrentJobs = config.ffmpeg.maxConcurrentJobs;
    this.ffmpegTimeout = config.ffmpeg.timeout * 1000; // Convert to ms
  }

  /**
   * Process video rendering request
   * @param {Object} request - Render request
   * @returns {Promise<Object>} - Job info
   */
  async processVideo(request) {
    const { template, variables, async = true, custom_config, user_id } = request;

    // Create job
    const jobId = await jobManager.createJob({
      template,
      variables,
      custom_config,
      user_id,
    });

    // Process asynchronously
    if (async) {
      this.renderVideoAsync(jobId, template, variables, custom_config, user_id);
      return {
        job_id: jobId,
        status: JobStatus.QUEUED,
      };
    } else {
      // Process synchronously (wait for completion)
      return this.renderVideoSync(jobId, template, variables, custom_config, user_id);
    }
  }

  /**
   * Render video asynchronously (fire and forget)
   */
  async renderVideoAsync(jobId, template, variables, customConfig, userId) {
    try {
      // Wait if max concurrent jobs reached
      await this.waitForSlot();

      // Mark as active
      this.activeJobs.set(jobId, { started_at: Date.now() });

      // Render video
      const result = await this.renderVideo(jobId, template, variables, customConfig);

      // Mark as completed
      await jobManager.completeJob(jobId, result.video_url, {
        duration: result.duration,
        file_size: result.file_size,
      });

      // Deduct credits after successful render (non-blocking)
      if (userId) {
        webhookService.deductCredits({
          user_id: userId,
          template_id: template,
          job_id: jobId,
          credits_to_deduct: 10, // TODO: Make this configurable per template
          video_url: result.video_url,
          duration: result.duration,
        }).catch((err) => {
          logger.warn('Failed to deduct credits after render', {
            jobId,
            userId,
            error: err.message,
          });
        });
      }
    } catch (error) {
      logger.logError(error, { jobId, template });
      await jobManager.failJob(jobId, error.message);
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Render video synchronously (wait for result)
   */
  async renderVideoSync(jobId, template, variables, customConfig, userId) {
    try {
      await this.waitForSlot();
      this.activeJobs.set(jobId, { started_at: Date.now() });

      const result = await this.renderVideo(jobId, template, variables, customConfig);

      await jobManager.completeJob(jobId, result.video_url, {
        duration: result.duration,
        file_size: result.file_size,
      });

      // Deduct credits after successful render (non-blocking)
      if (userId) {
        webhookService.deductCredits({
          user_id: userId,
          template_id: template,
          job_id: jobId,
          credits_to_deduct: 10, // TODO: Make this configurable per template
          video_url: result.video_url,
          duration: result.duration,
        }).catch((err) => {
          logger.warn('Failed to deduct credits after render', {
            jobId,
            userId,
            error: err.message,
          });
        });
      }

      return {
        job_id: jobId,
        status: JobStatus.COMPLETED,
        video_url: result.video_url,
      };
    } catch (error) {
      logger.logError(error, { jobId, template });
      await jobManager.failJob(jobId, error.message);
      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Main video rendering pipeline
   */
  async renderVideo(jobId, templateName, variables, customConfig) {
    let jobDir = null;

    try {
      logger.info('Starting video render', { jobId, templateName });

      // Update job status
      await jobManager.startProcessing(jobId);

      // 1. Process template
      logger.info('Processing template', { jobId });
      const processedTemplate = await templateEngine.processTemplate(
        templateName,
        variables,
        customConfig
      );

      // 2. Create job directory
      jobDir = await fileManager.createJobDir(jobId);
      logger.debug('Job directory created', { jobId, jobDir });

      // 3. Download assets
      logger.info('Downloading assets', { jobId });
      const inputFiles = await this.downloadAssets(
        processedTemplate.structure,
        variables,
        jobDir
      );

      // 4. Build FFmpeg command
      logger.info('Building FFmpeg command', { jobId });
      const outputFilename = fileManager.generateFilename('mp4');
      const outputPath = path.join(jobDir, outputFilename);

      const { command, duration } = buildFFmpegCommand(
        processedTemplate.structure,
        inputFiles,
        outputPath
      );

      logger.logFFmpegCommand(jobId, command);

      // 5. Execute FFmpeg
      logger.info('Executing FFmpeg', { jobId });
      await this.executeFFmpeg(command, jobId);

      // 6. Upload to storage
      logger.info('Uploading to storage', { jobId });
      const remoteFilename = `${jobId}/${outputFilename}`;
      const videoUrl = await storage.upload(outputPath, remoteFilename, 'video/mp4');

      // 7. Get file stats
      const stats = await fileManager.getFileStats(outputPath);

      logger.info('Video render completed', {
        jobId,
        videoUrl,
        duration,
        fileSize: stats.sizeHuman,
      });

      return {
        video_url: videoUrl,
        duration,
        file_size: stats.size,
        file_size_human: stats.sizeHuman,
      };
    } catch (error) {
      logger.error('Video render failed', {
        jobId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      // Cleanup job directory
      if (jobDir) {
        await fileManager.deleteDirectory(jobDir);
        logger.debug('Job directory cleaned up', { jobId });
      }
    }
  }

  /**
   * Download all required assets
   */
  async downloadAssets(structure, variables, jobDir) {
    const inputFiles = {};
    const downloadTasks = [];

    // Download video clips
    if (structure.clips) {
      for (const clip of structure.clips) {
        const varName = this.extractVariableName(clip.src);
        if (varName && variables[varName]) {
          downloadTasks.push(
            this.downloadAsset(variables[varName], jobDir, varName).then(
              (localPath) => {
                inputFiles[varName] = localPath;
              }
            )
          );
        }
      }
    }

    // Download voiceover
    if (structure.voiceover) {
      const varName = this.extractVariableName(structure.voiceover.src);
      if (varName && variables[varName]) {
        downloadTasks.push(
          this.downloadAsset(variables[varName], jobDir, varName).then(
            (localPath) => {
              inputFiles[varName] = localPath;
            }
          )
        );
      }
    }

    // Download background audio
    if (structure.audio) {
      const varName = this.extractVariableName(structure.audio.src);
      if (varName && variables[varName]) {
        downloadTasks.push(
          this.downloadAsset(variables[varName], jobDir, varName).then(
            (localPath) => {
              inputFiles[varName] = localPath;
            }
          )
        );
      }
    }

    // Wait for all downloads
    await Promise.all(downloadTasks);

    return inputFiles;
  }

  /**
   * Download single asset
   */
  async downloadAsset(url, jobDir, varName) {
    try {
      const ext = path.extname(new URL(url).pathname) || '.tmp';
      const filename = `${varName}${ext}`;
      return await fileManager.downloadFile(url, jobDir, filename);
    } catch (error) {
      throw new Error(`Failed to download ${varName}: ${error.message}`);
    }
  }

  /**
   * Extract variable name from template string (e.g., "{{video1}}" -> "video1")
   */
  extractVariableName(src) {
    const match = src.match(/\{\{(\w+)\}\}/);
    return match ? match[1] : src;
  }

  /**
   * Execute FFmpeg command
   */
  async executeFFmpeg(command, jobId) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.ffmpegTimeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Log FFmpeg output
      if (stderr) {
        logger.logFFmpegOutput(jobId, stderr);
      }

      return { stdout, stderr };
    } catch (error) {
      // FFmpeg writes progress to stderr, so check if it's an actual error
      if (error.code === 'ETIMEDOUT') {
        throw new Error('FFmpeg execution timed out');
      }

      // Check if output file was created (FFmpeg might succeed despite stderr)
      const outputMatch = error.cmd?.match(/"([^"]+\.mp4)"/);
      if (outputMatch) {
        const outputPath = outputMatch[1];
        const exists = await fileManager.fileExists(outputPath);
        if (exists) {
          logger.info('FFmpeg completed successfully despite stderr output', {
            jobId,
          });
          return { stdout: '', stderr: error.stderr };
        }
      }

      throw new Error(`FFmpeg execution failed: ${error.message}`);
    }
  }

  /**
   * Wait for available job slot
   */
  async waitForSlot() {
    while (this.activeJobs.size >= this.maxConcurrentJobs) {
      logger.debug('Max concurrent jobs reached, waiting...', {
        active: this.activeJobs.size,
        max: this.maxConcurrentJobs,
      });
      await this.sleep(1000); // Wait 1 second
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    return jobManager.getJobStatus(jobId);
  }

  /**
   * Get active jobs count
   */
  getActiveJobsCount() {
    return this.activeJobs.size;
  }

  /**
   * Get job statistics
   */
  async getStatistics() {
    const stats = await jobManager.getStatistics();
    stats.active = this.activeJobs.size;
    return stats;
  }

  /**
   * Check FFmpeg availability
   */
  async checkFFmpeg() {
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      return stdout.includes('ffmpeg version');
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const videoProcessor = new VideoProcessor();

module.exports = videoProcessor;
