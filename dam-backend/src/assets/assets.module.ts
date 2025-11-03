import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from '../entities/asset.entity';
import { S3Service } from '../services/s3.service';
import { LoggerService } from '../services/logger.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity-log.schema';
import { WebhookService } from '../services/webhook.service';

/**
 * Assets Module - Manages digital assets
 */
@Module({
  imports: [
    // TypeORM: Import Asset entity
    TypeOrmModule.forFeature([Asset]),

    // Mongoose: Import ActivityLog schema for logging
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService, S3Service, LoggerService, WebhookService],
  exports: [AssetsService],
})
export class AssetsModule {}

