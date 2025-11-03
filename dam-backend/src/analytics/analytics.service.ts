import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { Asset } from '../entities/asset.entity';
import { ActivityLog } from '../schemas/activity-log.schema';

/**
 * Analytics Service - Provides analytics data for dashboard
 * Responsibilities:
 * - Calculate storage usage
 * - Track user activities
 * - Generate statistics for admin and users
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLog>,
  ) {}

  /**
   * Get admin analytics
   * Shows system-wide statistics
   */
  async getAdminAnalytics() {
    // Total storage usage across all users
    const totalStorage = await this.assetRepository
      .createQueryBuilder('asset')
      .select('SUM(asset.size)', 'total')
      .getRawOne();
    const totalStorageBytes = parseInt(totalStorage?.total || '0');

    // Most active users (top 10 by activity count)
    const mostActiveUsers = await this.activityLogModel.aggregate([
      {
        $group: {
          _id: { userId: '$userId', userName: '$userName' },
          activityCount: { $sum: 1 },
        },
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          userId: '$_id.userId',
          userName: '$_id.userName',
          activityCount: 1,
        },
      },
    ]);

    // Total uploads and deletions
    const uploadCount = await this.activityLogModel.countDocuments({
      activityType: 'upload',
    });
    const deleteCount = await this.activityLogModel.countDocuments({
      activityType: 'delete',
    });

    // Total assets
    const totalAssets = await this.assetRepository.count();

    // Total users
    const totalUsers = await this.userRepository.count();

    return {
      storageUsage: {
        total: totalStorageBytes,
        totalGB: (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2),
      },
      mostActiveUsers,
      uploads: {
        total: uploadCount,
      },
      deletions: {
        total: deleteCount,
      },
      assets: {
        total: totalAssets,
      },
      users: {
        total: totalUsers,
      },
    };
  }

  /**
   * Get user analytics
   * Shows personal statistics for the user
   */
  async getUserAnalytics(userId: string) {
    // User's storage usage
    const userAssets = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.uploaderId = :userId', { userId })
      .select('SUM(asset.size)', 'total')
      .getRawOne();
    const userStorageBytes = parseInt(userAssets?.total || '0');

    // Asset type distribution
    const assetTypes = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.uploaderId = :userId', { userId })
      .select('asset.assetType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(asset.size)', 'totalSize')
      .groupBy('asset.assetType')
      .getRawMany();

    // Recent activity timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await this.activityLogModel
      .find({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      })
      .select('activityType createdAt assetFilename')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Personal stats
    const userUploadCount = await this.activityLogModel.countDocuments({
      userId,
      activityType: 'upload',
    });

    const userDeleteCount = await this.activityLogModel.countDocuments({
      userId,
      activityType: 'delete',
    });

    const userAssetCount = await this.assetRepository.count({
      where: { uploaderId: userId },
    });

    return {
      storageUsage: {
        total: userStorageBytes,
        totalMB: (userStorageBytes / (1024 * 1024)).toFixed(2),
      },
      assetTypeDistribution: assetTypes.map((item) => ({
        type: item.type,
        count: parseInt(item.count),
        totalSize: parseInt(item.totalSize || '0'),
      })),
      recentActivity: recentActivity.map((activity) => ({
        type: activity.activityType,
        date: activity.createdAt,
        filename: activity.assetFilename,
      })),
      statistics: {
        totalAssets: userAssetCount,
        totalUploads: userUploadCount,
        totalDeletions: userDeleteCount,
      },
    };
  }
}

