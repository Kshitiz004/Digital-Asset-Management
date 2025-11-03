import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

/**
 * Auth Module - Manages authentication and authorization
 * Exports: AuthService (for use in other modules)
 */
@Module({
  imports: [
    // TypeORM: Import User and Role entities
    TypeOrmModule.forFeature([User, Role]),

    // Passport: Enable JWT and Google OAuth strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT: Configure with secret and expiration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      useFactory: (configService: ConfigService) =>
        ({
          secret:
            configService.get<string>('JWT_SECRET') ||
            'your-secret-jwt-key-change-in-production',
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
          },
        }) as any,
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleOAuthStrategy],
  exports: [AuthService], // Export for use in other modules
})
export class AuthModule {}
