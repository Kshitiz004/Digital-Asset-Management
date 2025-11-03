import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration for MongoDB connection
 * This sets up Mongoose to connect to MongoDB for logging
 */
export const getMongoConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  return {
    uri: configService.get('MONGODB_URI', 'mongodb://localhost:27017/dam_logs'),
  };
};

