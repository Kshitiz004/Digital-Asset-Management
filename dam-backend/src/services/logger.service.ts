import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog } from '../schemas/activity-log.schema';

/**
 * Logger Service - Records activity logs in MongoDB
 * Responsibilities:
 * - Log user activities (uploads, views, deletions, etc.)
 * - Store performance metrics
 * - Track errors and failed actions
 */
@Injectable()
export class LoggerService {
  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLog>,
  ) {}

  /**
   * Log an activity
   * Usage: await this.logger.log('upload', userId, { assetId, filename })
   */
  async log(
    activityType: string,
    userId: string,
    userName: string,
    data: {
      assetId?: string;
      assetFilename?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
      errorMessage?: string;
      duration?: number;
    } = {},
  ): Promise<void> {
    try {
      const logEntry = new this.activityLogModel({
        activityType,
        userId,
        userName,
        assetId: data.assetId,
        assetFilename: data.assetFilename,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        errorMessage: data.errorMessage,
        duration: data.duration,
      });

      await logEntry.save();
    } catch (error) {
      // Silent fail - logging should not break application
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Log successful upload
   */
  async logUpload(
    userId: string,
    userName: string,
    assetId: string,
    filename: string,
    duration: number,
  ): Promise<void> {
    await this.log('upload', userId, userName, {
      assetId,
      assetFilename: filename,
      duration,
    });
  }

  /**
   * Log successful deletion
   */
  async logDelete(
    userId: string,
    userName: string,
    assetId: string,
    filename: string,
  ): Promise<void> {
    await this.log('delete', userId, userName, {
      assetId,
      assetFilename: filename,
    });
  }

  /**
   * Log file view/download
   */
  async logView(
    userId: string,
    userName: string,
    assetId: string,
    filename: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log('view', userId, userName, {
      assetId,
      assetFilename: filename,
      ipAddress,
    });
  }

  /**
   * Log failed action with error message
   */
  async logError(
    activityType: string,
    userId: string,
    userName: string,
    errorMessage: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log(activityType, userId, userName, {
      errorMessage,
      metadata,
    });
  }

  /**
   * Log share action
   */
  async logShare(
    userId: string,
    userName: string,
    assetId: string,
    filename: string,
  ): Promise<void> {
    await this.log('share', userId, userName, {
      assetId,
      assetFilename: filename,
    });
  }
}
