import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application
 * Configures:
 * - CORS for cross-origin requests
 * - Validation pipe for DTOs
 * - Swagger documentation at /api
 * - Static file serving for uploads
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that are not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Automatically transform payloads to DTO instances
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

  // Start server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

void bootstrap();
