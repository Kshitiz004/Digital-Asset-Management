import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AssetsModule } from './assets/assets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';
import { getPostgresConfig } from './config/database.config';
import { getMongoConfig } from './config/mongodb.config';

/**
 * App Module - Root module of the application
 * Imports all feature modules and configures databases
 */
@Module({
  imports: [
    // Config: Load environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available to all modules
    }),

    // TypeORM: PostgreSQL database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getPostgresConfig,
      inject: [ConfigService],
    }),

    // Mongoose: MongoDB connection for logging
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getMongoConfig,
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    AssetsModule,
    AnalyticsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
