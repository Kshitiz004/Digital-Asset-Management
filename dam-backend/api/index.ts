import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

let cachedApp: express.Application;

async function createApp(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter,
  );

  // Enable CORS for frontend communication
  // Support both local and production URLs
  // If CORS_ORIGINS is set to "*" or "ALL", allow all origins
  const corsOrigins = process.env.CORS_ORIGINS;
  const allowAllOrigins = corsOrigins === '*' || corsOrigins === 'ALL';

  const allowedOrigins = allowAllOrigins
    ? true // Allow all origins
    : corsOrigins
      ? corsOrigins.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Serve static files from uploads directory (for local storage)
  // Note: In Vercel, use S3 for file storage as local storage is ephemeral
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Digital Asset Management API')
    .setDescription(
      'Backend API for managing digital assets with role-based access control',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  const app = await createApp();
  app(req, res);
}
