import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

interface WebhookPayload {
  event: string;
  timestamp: number;
  data: any;
}

/**
 * Webhook Service - Implements webhook notifications with retry mechanism
 * Responsibilities:
 * - Trigger webhooks for asset events
 * - Implement exponential backoff for retries
 * - Sign webhook payloads for security
 */
@Injectable()
export class WebhookService {
  private webhookUrls: string[] = []; // Configure webhook URLs in production
  private webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.webhookSecret = this.configService.get(
      'WEBHOOK_SECRET',
      'your-webhook-secret-key',
    );
  }

  /**
   * Add webhook URL to list
   */
  addWebhookUrl(url: string): void {
    if (!this.webhookUrls.includes(url)) {
      this.webhookUrls.push(url);
    }
  }

  /**
   * Remove webhook URL
   */
  removeWebhookUrl(url: string): void {
    this.webhookUrls = this.webhookUrls.filter((u) => u !== url);
  }

  /**
   * Sign webhook payload with HMAC-SHA256
   */
  private signPayload(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Send webhook with retry mechanism
   * Uses exponential backoff: 1s, 2s, 4s, 8s, 16s
   */
  private async sendWithRetry(
    url: string,
    payload: WebhookPayload,
    maxRetries: number = 5,
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);
    const signature = this.signPayload(payloadString);
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': payload.timestamp.toString(),
          },
          timeout: 10000, // 10 second timeout
        });

        if (response.status >= 200 && response.status < 300) {
          console.log(`Webhook sent successfully to ${url}`);
          return;
        }
      } catch (error) {
        console.error(
          `Webhook attempt ${attempt + 1} failed for ${url}:`,
          error.message,
        );

        // If last attempt, log final failure
        if (attempt === maxRetries - 1) {
          console.error(
            `Webhook failed after ${maxRetries} attempts for ${url}`,
          );
          return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
      }

      attempt++;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Trigger webhook for all registered URLs
   */
  async triggerWebhook(event: string, data: any): Promise<void> {
    // Don't send if no webhooks configured
    if (this.webhookUrls.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data,
    };

    // Send to all webhook URLs in parallel
    const promises = this.webhookUrls.map((url) =>
      this.sendWithRetry(url, payload),
    );
    await Promise.allSettled(promises);
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifySignature(
    payload: string,
    signature: string,
    timestamp: string,
  ): boolean {
    try {
      // Check timestamp to prevent replay attacks (within 5 minutes)
      const payloadTimestamp = parseInt(timestamp);
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (Math.abs(currentTime - payloadTimestamp) > fiveMinutes) {
        console.error('Webhook timestamp too old or too new');
        return false;
      }

      // Verify signature
      const expectedSignature = this.signPayload(payload);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

