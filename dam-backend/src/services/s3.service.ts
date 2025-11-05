import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * S3 Service - Handles file storage operations
 * Responsibilities:
 * - Upload files (AWS S3 or local storage)
 * - Generate signed URLs for downloads
 * - Delete files
 * - Get file metadata
 *
 * Note: Automatically falls back to local storage if AWS credentials not configured
 */
@Injectable()
export class S3Service {
  private s3: AWS.S3 | null = null;
  private bucketName: string;
  private useLocalStorage: boolean;
  private localStoragePath: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    // Check if AWS credentials are provided
    if (
      accessKeyId &&
      secretAccessKey &&
      accessKeyId !== 'your-aws-access-key'
    ) {
      // Configure AWS SDK
      this.s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      });
      this.useLocalStorage = false;
      console.log('📦 Using AWS S3 for file storage');
    } else {
      // Use local storage
      this.useLocalStorage = true;
      this.localStoragePath = path.join(process.cwd(), 'uploads');
      // Create uploads directory if it doesn't exist
      fs.ensureDirSync(this.localStoragePath);
      console.log('💾 Using local file storage for testing (uploads folder)');
    }

    this.bucketName = this.configService.get(
      'S3_BUCKET_NAME',
      'dam-assets-bucket',
    );
  }

  /**
   * Upload file to storage (S3 or local)
   * Flow:
   * 1. Generate unique key (path)
   * 2. Upload file buffer
   * 3. Return key and metadata
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ key: string; location: string; bucket: string }> {
    try {
      // Generate unique key: userId/filename-uuid.ext
      const fileExtension = file.originalname.split('.').pop();
      const sanitizedFilename = file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        '_',
      );
      const uniqueFilename = `${sanitizedFilename}-${uuidv4()}.${fileExtension}`;
      const storageKey = `${userId}/${uniqueFilename}`;

      if (this.useLocalStorage) {
        // Local storage implementation
        const userDir = path.join(this.localStoragePath, userId);
        await fs.ensureDir(userDir);

        const filePath = path.join(userDir, uniqueFilename);
        await fs.writeFile(filePath, file.buffer);

        return {
          key: storageKey,
          location: `/uploads/${storageKey}`,
          bucket: 'local-storage',
        };
      } else {
        // AWS S3 implementation
        const uploadParams: AWS.S3.PutObjectRequest = {
          Bucket: this.bucketName,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'private',
        };

        const result = await this.s3!.upload(uploadParams).promise();

        return {
          key: result.Key,
          location: result.Location,
          bucket: result.Bucket,
        };
      }
    } catch (error) {
      console.error('Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Generate presigned URL for file download
   * Presigned URLs are temporary and expire after specified time
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (this.useLocalStorage) {
        // For local storage, return the file path
        // Support both local and production URLs
        const baseUrl =
          this.configService.get<string>('API_URL') ||
          `http://localhost:${this.configService.get('PORT', 3000)}`;
        return `${baseUrl}/uploads/${key}`;
      } else {
        // AWS S3 presigned URL
        const params: AWS.S3.GetObjectRequest = {
          Bucket: this.bucketName,
          Key: key,
        };

        const url = await this.s3!.getSignedUrlPromise('getObject', {
          ...params,
          Expires: expiresIn,
        });

        return url;
      }
    } catch (error) {
      console.error('Signed URL Error:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      if (this.useLocalStorage) {
        // Delete from local storage
        const filePath = path.join(this.localStoragePath, key);
        await fs.remove(filePath);
      } else {
        // Delete from S3
        const params: AWS.S3.DeleteObjectRequest = {
          Bucket: this.bucketName,
          Key: key,
        };

        await this.s3!.deleteObject(params).promise();
      }
    } catch (error) {
      console.error('Delete Error:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Make file publicly accessible
   */
  async makePublic(key: string): Promise<string> {
    try {
      if (this.useLocalStorage) {
        // For local storage, files are accessible via the public URL
        // Support both local and production URLs
        const baseUrl =
          this.configService.get<string>('API_URL') ||
          `http://localhost:${this.configService.get('PORT', 3000)}`;
        return `${baseUrl}/uploads/${key}`;
      } else {
        // Update S3 ACL to public-read
        await this.s3!.putObjectAcl({
          Bucket: this.bucketName,
          Key: key,
          ACL: 'public-read',
        }).promise();

        // Return public S3 URL
        return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
      }
    } catch (error) {
      console.error('Make Public Error:', error);
      throw new InternalServerErrorException('Failed to make file public');
    }
  }

  /**
   * Detect asset type from MIME type
   */
  detectAssetType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('msword') ||
      mimeType.includes('text')
    ) {
      return 'document';
    }
    return 'other';
  }
}
