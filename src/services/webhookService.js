/**
 * Webhook Service
 * Handles communication with n8n webhooks for credit system
 */

const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Webhook Service Class
 */
class WebhookService {
  constructor() {
    this.checkCreditsUrl = process.env.N8N_WEBHOOK_CHECK_CREDITS;
    this.saveTemplateUrl = process.env.N8N_WEBHOOK_SAVE_TEMPLATE;
    this.deductCreditsUrl = process.env.N8N_WEBHOOK_DEDUCT_CREDITS;
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Get common headers for webhook requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.webhookSecret) {
      headers['X-Webhook-Secret'] = this.webhookSecret;
    }

    return headers;
  }

  /**
   * Check if user has enough credits
   * @param {string} apiKey - User's API key
   * @returns {Promise<Object>} - { success, user_id, credits, user_name }
   */
  async checkCredits(apiKey) {
    if (!this.checkCreditsUrl) {
      logger.warn('N8N_WEBHOOK_CHECK_CREDITS not configured, skipping credit check');
      return { success: true, user_id: 0, credits: 999999, user_name: 'Anonymous' };
    }

    try {
      logger.debug('Checking credits via webhook', { apiKey: apiKey.substring(0, 10) + '...' });

      const response = await axios.post(
        this.checkCreditsUrl,
        { api_key: apiKey },
        {
          headers: this.getHeaders(),
          timeout: this.timeout,
        }
      );

      logger.debug('Credit check response', { data: response.data });

      if (response.data.success) {
        return {
          success: true,
          user_id: response.data.user_id,
          credits: response.data.credits,
          user_name: response.data.user_name || 'User',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Credit check failed',
        };
      }
    } catch (error) {
      logger.error('Credit check webhook failed', {
        error: error.message,
        url: this.checkCreditsUrl,
      });

      // If webhook fails, log but allow render (fail-open for reliability)
      return {
        success: true,
        user_id: 0,
        credits: 0,
        user_name: 'Unknown',
        warning: 'Credit check unavailable',
      };
    }
  }

  /**
   * Save template metadata to NocoDB via n8n
   * @param {Object} templateData - Template metadata
   * @returns {Promise<Object>} - { success, template_id }
   */
  async saveTemplateMetadata(templateData) {
    if (!this.saveTemplateUrl) {
      logger.warn('N8N_WEBHOOK_SAVE_TEMPLATE not configured, skipping metadata save');
      return { success: true };
    }

    try {
      logger.debug('Saving template metadata via webhook', {
        template_id: templateData.template_id,
      });

      const response = await axios.post(
        this.saveTemplateUrl,
        {
          template_id: templateData.template_id,
          user_id: templateData.user_id,
          name: templateData.name,
          description: templateData.description || '',
          category: templateData.category || 'custom',
        },
        {
          headers: this.getHeaders(),
          timeout: this.timeout,
        }
      );

      logger.debug('Template metadata save response', { data: response.data });

      return response.data;
    } catch (error) {
      logger.error('Save template metadata webhook failed', {
        error: error.message,
        template_id: templateData.template_id,
      });

      // Non-critical error, template is saved locally
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct credits after successful render
   * @param {Object} renderData - Render information
   * @returns {Promise<Object>} - { success, remaining_credits }
   */
  async deductCredits(renderData) {
    if (!this.deductCreditsUrl) {
      logger.warn('N8N_WEBHOOK_DEDUCT_CREDITS not configured, skipping credit deduction');
      return { success: true, remaining_credits: 999999 };
    }

    try {
      logger.debug('Deducting credits via webhook', {
        user_id: renderData.user_id,
        credits: renderData.credits_to_deduct,
      });

      const response = await axios.post(
        this.deductCreditsUrl,
        {
          user_id: renderData.user_id,
          template_id: renderData.template_id,
          job_id: renderData.job_id,
          credits_to_deduct: renderData.credits_to_deduct,
          video_url: renderData.video_url,
          duration: renderData.duration || 0,
        },
        {
          headers: this.getHeaders(),
          timeout: this.timeout,
        }
      );

      logger.info('Credits deducted successfully', {
        user_id: renderData.user_id,
        credits: renderData.credits_to_deduct,
        remaining: response.data.remaining_credits,
      });

      return response.data;
    } catch (error) {
      logger.error('Deduct credits webhook failed', {
        error: error.message,
        user_id: renderData.user_id,
      });

      // Critical error, but render already completed
      // Log for admin to manually deduct credits
      return { success: false, error: error.message };
    }
  }

  /**
   * Health check for webhook endpoints
   * @returns {Promise<Object>} - Status of each webhook
   */
  async healthCheck() {
    const status = {
      check_credits: this.checkCreditsUrl ? 'configured' : 'not configured',
      save_template: this.saveTemplateUrl ? 'configured' : 'not configured',
      deduct_credits: this.deductCreditsUrl ? 'configured' : 'not configured',
    };

    return status;
  }
}

// Create singleton instance
const webhookService = new WebhookService();

module.exports = webhookService;
