import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { S3Service } from '../services/s3.service';
import { LoggerService } from '../services/logger.service';
import { WebhookService } from '../services/webhook.service';

/**
 * Assets Service - Manages digital assets
 * Responsibilities:
 * - Upload assets to S3 and store metadata in Postgres
 * - Retrieve user assets
 * - Update asset metadata
 * - Delete assets (from both S3 and database)
 * - Share assets publicly
 */
@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private s3Service: S3Service,
    private loggerService: LoggerService,
    private webhookService: WebhookService,
  ) {}

  /**
   * Upload asset
   * Flow:
   * 1. Upload file to S3
   * 2. Create asset record in Postgres
   * 3. Log activity
   * 4. Trigger webhook
   */
  async uploadAsset(
    file: Express.Multer.File,
    userId: string,
    userName: string,
    tags?: string,
    description?: string,
  ): Promise<Asset> {
    const startTime = Date.now();

    try {
      // Upload to S3
      const s3Result = await this.s3Service.uploadFile(file, userId);

      // Detect asset type
      const assetType = this.s3Service.detectAssetType(file.mimetype);

      // Create asset record
      const asset = this.assetRepository.create({
        filename: file.originalname,
        s3Key: s3Result.key,
        bucket: s3Result.bucket,
        size: file.size,
        mimeType: file.mimetype,
        assetType,
        tags,
        description,
        uploaderId: userId,
        isShared: false,
      });

      // Save to database
      await this.assetRepository.save(asset);

      // Log activity (non-blocking - don't fail if logging fails)
      const duration = Date.now() - startTime;
      this.loggerService
        .logUpload(userId, userName, asset.id, asset.filename, duration)
        .catch((err) => console.error('Failed to log upload activity:', err));

      // Trigger webhook for upload event (non-blocking)
      this.webhookService
        .triggerWebhook('asset.uploaded', {
          assetId: asset.id,
          filename: asset.filename,
          userId,
          size: asset.size,
          assetType,
        })
        .catch((err) => console.error('Failed to trigger webhook:', err));

      return asset;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('Upload failed:', {
        error: errorMessage,
        stack: errorStack,
        filename: file.originalname,
        size: file.size,
        userId,
      });

      // Log error (non-blocking)
      this.loggerService
        .logError('failed_upload', userId, userName, errorMessage, {
          filename: file.originalname,
          size: file.size,
        })
        .catch((err) => console.error('Failed to log error:', err));

      // Re-throw with more descriptive message
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to upload file: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get all assets for a user
   */
  async getUserAssets(userId: string, assetType?: string): Promise<Asset[]> {
    const where: { uploaderId: string; assetType?: string } = {
      uploaderId: userId,
    };
    if (assetType) {
      where.assetType = assetType;
    }

    return this.assetRepository.find({
      where,
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all assets (admin only)
   */
  async getAllAssets(assetType?: string): Promise<Asset[]> {
    const where: { assetType?: string } = {};
    if (assetType) {
      where.assetType = assetType;
    }

    return this.assetRepository.find({
      where,
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all shared assets (for viewers)
   */
  async getSharedAssets(assetType?: string): Promise<Asset[]> {
    const where: { isShared: boolean; assetType?: string } = { isShared: true };
    if (assetType) {
      where.assetType = assetType;
    }

    return this.assetRepository.find({
      where,
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get single asset by ID
   */
  async getAssetById(assetId: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
      relations: ['uploader'],
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  /**
   * Get signed download URL for asset
   */
  async getDownloadUrl(
    assetId: string,
    userId: string,
    userName: string,
  ): Promise<string> {
    const asset = await this.getAssetById(assetId);
    // Pass filename to S3 service to set Content-Disposition header for download
    const url = await this.s3Service.getSignedUrl(
      asset.s3Key,
      3600,
      asset.filename,
    );

    // Log download activity (non-blocking)
    this.loggerService
      .logView(userId, userName, asset.id, asset.filename)
      .catch((err) => console.error('Failed to log download activity:', err));

    return url;
  }

  /**
   * Get signed view URL for asset (opens in browser, no forced download)
   */
  async getViewUrl(
    assetId: string,
    userId: string,
    userName: string,
  ): Promise<string> {
    const asset = await this.getAssetById(assetId);
    // Don't pass filename - allows browser to display instead of forcing download
    const url = await this.s3Service.getSignedUrl(asset.s3Key, 3600);

    // Log view activity (non-blocking)
    this.loggerService
      .logView(userId, userName, asset.id, asset.filename)
      .catch((err) => console.error('Failed to log view activity:', err));

    return url;
  }

  /**
   * Update asset metadata
   */
  async updateAsset(
    assetId: string,
    userId: string,
    userName: string,
    updates: { tags?: string; description?: string },
  ): Promise<Asset> {
    const asset = await this.getAssetById(assetId);

    // Check ownership
    if (asset.uploaderId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this asset',
      );
    }

    // Apply updates
    if (updates.tags !== undefined) asset.tags = updates.tags;
    if (updates.description !== undefined)
      asset.description = updates.description;

    await this.assetRepository.save(asset);

    return asset;
  }

  /**
   * Delete asset
   * Flow:
   * 1. Check ownership
   * 2. Delete from S3
   * 3. Delete from database
   * 4. Log activity
   * 5. Trigger webhook
   */
  async deleteAsset(
    assetId: string,
    userId: string,
    userName: string,
    userRole?: string,
  ): Promise<void> {
    const asset = await this.getAssetById(assetId);

    // Check ownership (admins can delete any asset)
    if (asset.uploaderId !== userId && userRole !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to delete this asset',
      );
    }

    try {
      // Delete from S3
      await this.s3Service.deleteFile(asset.s3Key);

      // Delete from database
      await this.assetRepository.remove(asset);

      // Log activity
      await this.loggerService.logDelete(
        userId,
        userName,
        asset.id,
        asset.filename,
      );

      // Trigger webhook
      await this.webhookService.triggerWebhook('asset.deleted', {
        assetId: asset.id,
        filename: asset.filename,
        userId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.loggerService.logError(
        'failed_delete',
        userId,
        userName,
        errorMessage,
        { assetId },
      );
      throw error;
    }
  }

  /**
   * Share asset publicly
   */
  async shareAsset(
    assetId: string,
    userId: string,
    userName: string,
  ): Promise<Asset> {
    const asset = await this.getAssetById(assetId);

    // Check ownership
    if (asset.uploaderId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to share this asset',
      );
    }

    // Make public in S3 and get public URL
    const publicUrl = await this.s3Service.makePublic(asset.s3Key);

    // Update asset record
    asset.isShared = true;
    asset.sharedUrl = publicUrl;
    await this.assetRepository.save(asset);

    // Log and trigger webhook
    await this.loggerService.logShare(
      userId,
      userName,
      asset.id,
      asset.filename,
    );
    await this.webhookService.triggerWebhook('asset.shared', {
      assetId: asset.id,
      filename: asset.filename,
      userId,
      publicUrl,
    });

    return asset;
  }

  /**
   * Get shared asset (no authentication required)
   */
  async getSharedAsset(
    assetId: string,
  ): Promise<{ asset: Asset; downloadUrl: string }> {
    const asset = await this.getAssetById(assetId);

    if (!asset.isShared) {
      throw new NotFoundException('Asset is not shared');
    }

    // Pass filename to force download for shared assets
    const downloadUrl = await this.s3Service.getSignedUrl(
      asset.s3Key,
      3600,
      asset.filename,
    );

    return { asset, downloadUrl };
  }
}
