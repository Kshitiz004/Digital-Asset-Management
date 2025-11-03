import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * JWT Strategy - Validates JWT tokens from requests
 * Flow:
 * 1. Extracts JWT from Authorization header
 * 2. Verifies token signature using secret
 * 3. Decodes payload (userId, email, role)
 * 4. Returns user data for request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      // Extract JWT from Authorization header: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Whether to ignore expiration (false = enforce expiration)
      ignoreExpiration: false,

      // Secret key to verify token signature
      secretOrKey: configService.get(
        'JWT_SECRET',
        'your-secret-jwt-key-change-in-production',
      ),
    });
  }

  /**
   * Validate method - called after JWT is verified
   * Payload contains: { sub: userId, email, role }
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    // Validate user still exists in database
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user data to be attached to request object
    return {
      userId: user.id,
      email: user.email,
      role: user.roleName,
      user: user,
    };
  }
}
