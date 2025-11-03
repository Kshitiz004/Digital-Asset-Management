import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User } from '../entities/user.entity';
import { Asset } from '../entities/asset.entity';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity-log.schema';

/**
 * Analytics Module - Provides analytics data
 */
@Module({
  imports: [
    // TypeORM: Import User and Asset entities
    TypeOrmModule.forFeature([User, Asset]),

    // Mongoose: Import ActivityLog schema
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
