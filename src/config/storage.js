/**
 * Storage Adapter Module
 * Provides unified interface for multiple storage backends:
 * - Cloudflare R2 (S3-compatible)
 * - AWS S3
 * - Local filesystem
 */

const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

/**
 * Storage Adapter Factory
 * Creates appropriate storage adapter based on configuration
 */
class StorageAdapter {
  constructor() {
    this.type = config.storage.type;
    this.client = null;
    this.initialized = false;

    // Initialize storage client based on type
    this.init();
  }

  /**
   * Initialize storage client
   */
  async init() {
    try {
      switch (this.type) {
        case 'r2':
          await this.initR2();
          break;
        case 's3':
          await this.initS3();
          break;
        case 'local':
          await this.initLocal();
          break;
        default:
          throw new Error(`Unknown storage type: ${this.type}`);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Storage initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize Cloudflare R2 client
   */
  async initR2() {
    const { accountId, accessKeyId, secretAccessKey } = config.storage.r2;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucket = config.storage.r2.bucket;
    this.publicUrlBase = config.storage.r2.publicUrl;
  }

  /**
   * Initialize AWS S3 client
   */
  async initS3() {
    const { region, accessKeyId, secretAccessKey } = config.storage.s3;

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucket = config.storage.s3.bucket;
    this.region = region;
  }

  /**
   * Initialize local filesystem storage
   */
  async initLocal() {
    const storagePath = config.storage.local.storagePath;

    // Create storage directory if it doesn't exist
    try {
      await fs.mkdir(storagePath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    this.storagePath = storagePath;
    this.baseUrl = config.storage.local.baseUrl;
  }

  /**
   * Upload file to storage
   * @param {string} localFilePath - Local file path to upload
   * @param {string} remoteFilePath - Remote path/key for the file
   * @param {string} contentType - MIME type of the file
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async upload(localFilePath, remoteFilePath, contentType = 'video/mp4') {
    if (!this.initialized) {
      throw new Error('Storage adapter not initialized');
    }

    try {
      switch (this.type) {
        case 'r2':
        case 's3':
          return await this.uploadToS3(localFilePath, remoteFilePath, contentType);
        case 'local':
          return await this.uploadToLocal(localFilePath, remoteFilePath);
        default:
          throw new Error(`Upload not supported for storage type: ${this.type}`);
      }
    } catch (error) {
      console.error('Upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload to S3-compatible storage (R2 or S3)
   */
  async uploadToS3(localFilePath, remoteFilePath, contentType) {
    // Read file from local filesystem
    const fileBuffer = await fs.readFile(localFilePath);

    // Prepare upload parameters
    const uploadParams = {
      Bucket: this.bucket,
      Key: remoteFilePath,
      Body: fileBuffer,
      ContentType: contentType,
    };

    // Make public if configured
    if (config.storage.makePublic) {
      uploadParams.ACL = 'public-read';
    }

    // Upload to S3/R2
    const command = new PutObjectCommand(uploadParams);
    await this.client.send(command);

    // Return public URL
    return this.getPublicUrl(remoteFilePath);
  }

  /**
   * Upload to local filesystem
   */
  async uploadToLocal(localFilePath, remoteFilePath) {
    const targetPath = path.join(this.storagePath, remoteFilePath);

    // Create directory if needed
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });

    // Copy file
    await fs.copyFile(localFilePath, targetPath);

    // Return public URL
    return this.getPublicUrl(remoteFilePath);
  }

  /**
   * Get public URL for uploaded file
   * @param {string} remoteFilePath - Remote path/key
   * @returns {string} - Public URL
   */
  getPublicUrl(remoteFilePath) {
    switch (this.type) {
      case 'r2':
        // Use custom public URL if configured
        if (this.publicUrlBase) {
          return `${this.publicUrlBase}/${remoteFilePath}`;
        }
        // Fallback to R2.dev URL (if bucket is public)
        return `https://${this.bucket}.r2.dev/${remoteFilePath}`;

      case 's3':
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${remoteFilePath}`;

      case 'local':
        return `${this.baseUrl}/${remoteFilePath}`;

      default:
        throw new Error(`Public URL not supported for storage type: ${this.type}`);
    }
  }

  /**
   * Check storage health
   * @returns {Promise<Object>} - Health check result
   */
  async healthCheck() {
    try {
      switch (this.type) {
        case 'r2':
        case 's3':
          // Check if bucket is accessible
          const command = new HeadBucketCommand({ Bucket: this.bucket });
          await this.client.send(command);
          return { status: 'ok', type: this.type, bucket: this.bucket };

        case 'local':
          // Check if storage directory exists and is writable
          await fs.access(this.storagePath, fs.constants.W_OK);
          return { status: 'ok', type: this.type, path: this.storagePath };

        default:
          return { status: 'unknown', type: this.type };
      }
    } catch (error) {
      return {
        status: 'error',
        type: this.type,
        error: error.message,
      };
    }
  }

  /**
   * Delete file from storage
   * @param {string} remoteFilePath - Remote path/key to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(remoteFilePath) {
    try {
      switch (this.type) {
        case 'r2':
        case 's3':
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: remoteFilePath,
          });
          await this.client.send(command);
          return true;

        case 'local':
          const targetPath = path.join(this.storagePath, remoteFilePath);
          await fs.unlink(targetPath);
          return true;

        default:
          throw new Error(`Delete not supported for storage type: ${this.type}`);
      }
    } catch (error) {
      console.error('Delete failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const storage = new StorageAdapter();

module.exports = storage;
