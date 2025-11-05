import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration for PostgreSQL database connection
 * This sets up TypeORM to connect to PostgreSQL with entities
 */
export const getPostgresConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const isDevelopment = configService.get('NODE_ENV') === 'development';

  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'dam_db'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: isDevelopment, // Auto-create tables in dev
    logging: isDevelopment,
    // Enable SSL for cloud databases (Neon, Supabase, etc.)
    ssl: isProduction
      ? {
          rejectUnauthorized: false, // Required for cloud databases
        }
      : false, // Disable SSL for local development
  };
};
