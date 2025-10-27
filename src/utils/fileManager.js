/**
 * File Manager Module
 * Handles temporary file operations, downloads, and cleanup
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const logger = require('./logger');

/**
 * File Manager Class
 */
class FileManager {
  constructor() {
    this.tempDir = config.ffmpeg.tempDir;
    this.downloadTimeout = config.ffmpeg.downloadTimeout * 1000; // Convert to ms
  }

  /**
   * Initialize file manager (create temp directory)
   */
  async init() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info('File manager initialized', { tempDir: this.tempDir });
    } catch (error) {
      logger.error('Failed to initialize file manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Create temporary directory for a job
   * @param {string} jobId - Job identifier
   * @returns {Promise<string>} - Path to job directory
   */
  async createJobDir(jobId) {
    const jobDir = path.join(this.tempDir, jobId);
    await fs.mkdir(jobDir, { recursive: true });
    return jobDir;
  }

  /**
   * Download remote file to local temp directory
   * @param {string} url - Remote file URL
   * @param {string} jobDir - Job directory path
   * @param {string} filename - Optional filename (auto-generated if not provided)
   * @returns {Promise<string>} - Local file path
   */
  async downloadFile(url, jobDir, filename = null) {
    try {
      logger.debug('Downloading file', { url, jobDir });

      // Generate filename if not provided
      if (!filename) {
        const ext = path.extname(new URL(url).pathname) || '.tmp';
        filename = `${uuidv4()}${ext}`;
      }

      const localPath = path.join(jobDir, filename);

      // Download file with timeout
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: this.downloadTimeout,
        maxContentLength: 500 * 1024 * 1024, // 500MB max
        maxBodyLength: 500 * 1024 * 1024,
      });

      // Write stream to file
      const writer = require('fs').createWriteStream(localPath);
      response.data.pipe(writer);

      // Wait for download to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      logger.debug('File downloaded successfully', { url, localPath });
      return localPath;
    } catch (error) {
      logger.error('File download failed', { url, error: error.message });
      throw new Error(`Failed to download file from ${url}: ${error.message}`);
    }
  }

  /**
   * Download multiple files in parallel
   * @param {Array} urls - Array of URLs or {url, filename} objects
   * @param {string} jobDir - Job directory path
   * @returns {Promise<Array>} - Array of local file paths
   */
  async downloadFiles(urls, jobDir) {
    const downloadPromises = urls.map((item) => {
      if (typeof item === 'string') {
        return this.downloadFile(item, jobDir);
      } else {
        return this.downloadFile(item.url, jobDir, item.filename);
      }
    });

    return Promise.all(downloadPromises);
  }

  /**
   * Get file stats
   * @param {string} filePath - File path
   * @returns {Promise<Object>} - File stats
   */
  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        sizeHuman: this.formatBytes(stats.size),
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error('Failed to get file stats', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes
   * @param {number} decimals - Decimal places
   * @returns {string} - Formatted string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {Promise<boolean>} - Exists or not
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file
   * @param {string} filePath - File path
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug('File deleted', { filePath });
      return true;
    } catch (error) {
      logger.warn('Failed to delete file', { filePath, error: error.message });
      return false;
    }
  }

  /**
   * Delete directory recursively
   * @param {string} dirPath - Directory path
   * @returns {Promise<boolean>} - Success status
   */
  async deleteDirectory(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      logger.debug('Directory deleted', { dirPath });
      return true;
    } catch (error) {
      logger.warn('Failed to delete directory', { dirPath, error: error.message });
      return false;
    }
  }

  /**
   * Clean up job directory
   * @param {string} jobId - Job identifier
   * @returns {Promise<boolean>} - Success status
   */
  async cleanupJob(jobId) {
    const jobDir = path.join(this.tempDir, jobId);
    return this.deleteDirectory(jobDir);
  }

  /**
   * Clean up old job directories (older than specified hours)
   * @param {number} hoursOld - Age threshold in hours
   * @returns {Promise<number>} - Number of directories cleaned
   */
  async cleanupOldJobs(hoursOld = 24) {
    try {
      const dirs = await fs.readdir(this.tempDir);
      let cleaned = 0;

      for (const dir of dirs) {
        const dirPath = path.join(this.tempDir, dir);
        const stats = await fs.stat(dirPath);

        if (stats.isDirectory()) {
          const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

          if (ageHours > hoursOld) {
            await this.deleteDirectory(dirPath);
            cleaned++;
          }
        }
      }

      logger.info('Cleanup completed', { cleaned, threshold: `${hoursOld}h` });
      return cleaned;
    } catch (error) {
      logger.error('Cleanup failed', { error: error.message });
      return 0;
    }
  }

  /**
   * Get total disk usage of temp directory
   * @returns {Promise<Object>} - { total, human }
   */
  async getDiskUsage() {
    try {
      let total = 0;

      const calculateSize = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            await calculateSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            total += stats.size;
          }
        }
      };

      await calculateSize(this.tempDir);

      return {
        total,
        human: this.formatBytes(total),
      };
    } catch (error) {
      logger.error('Failed to calculate disk usage', { error: error.message });
      return { total: 0, human: '0 Bytes' };
    }
  }

  /**
   * Generate unique filename
   * @param {string} extension - File extension (with or without dot)
   * @returns {string} - Unique filename
   */
  generateFilename(extension = '.mp4') {
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    return `${uuidv4()}${extension}`;
  }
}

// Create singleton instance
const fileManager = new FileManager();

module.exports = fileManager;
