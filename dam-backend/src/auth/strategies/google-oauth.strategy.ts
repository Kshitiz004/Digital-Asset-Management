import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth Strategy - Authenticates users via Google
 * Flow:
 * 1. Redirects user to Google login page
 * 2. User authorizes the app
 * 3. Google sends authorization code
 * 4. Exchange code for user profile
 * 5. Return user info (email, name, picture)
 *
 * Note: This strategy is disabled by default. To enable, add credentials to .env
 * and uncomment GoogleOAuthStrategy import in auth.module.ts
 */
@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID =
      configService.get<string>('GOOGLE_CLIENT_ID') || 'dummy-client-id';
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET') ||
      'dummy-client-secret';

    // Use dummy values if credentials are not provided to prevent OAuth2Strategy from throwing
    // The strategy won't be used in production without proper credentials
    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  /**
   * Validate method - called after Google authentication
   * Receives user profile from Google
   */
  validate(
    accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      name: { givenName: string; familyName: string };
      emails: Array<{ value: string }>;
      photos: Array<{ value: string }>;
    },
    done: VerifyCallback,
  ): void {
    // Extract user info from Google profile
    const { id, name, emails, photos } = profile;

    const user = {
      id,
      email: emails[0]?.value ?? '',
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0]?.value ?? '',
      accessToken,
    };

    // Pass user info to next step (googleCallback in controller)
    done(null, user);
  }
}
