import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import type { Request, Response } from 'express';
import type { User } from '../entities/user.entity';

/**
 * Interface for user data attached to request by JWT strategy
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    user: User;
  };
}

/**
 * Interface for Google OAuth user data
 */
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
}

/**
 * Auth Controller - Handles authentication endpoints
 * Routes:
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login with email/password
 * - GET /auth/google - Initiate Google OAuth
 * - GET /auth/google/callback - Google OAuth callback
 * - GET /auth/profile - Get current user profile
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Register new user with email/password
   * Creates account, hashes password, assigns 'user' role
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login with email/password
   * Validates credentials and returns JWT token
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Initiate Google OAuth flow
   * Redirects user to Google login page
   */
  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Passport automatically redirects to Google
  }

  /**
   * Google OAuth callback
   * Handles redirect from Google after authentication
   */
  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ): Promise<void> {
    // User data from Google is in req.user (set by GoogleOAuthStrategy)
    const result = await this.authService.googleLogin(req.user);

    // Redirect to frontend with token (supports both local and production)
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  /**
   * Get current user profile
   * Protected route - requires valid JWT token
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req: AuthenticatedRequest) {
    // User data attached to request by JWT strategy
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      name: req.user.user.name,
      user: req.user.user,
    };
  }
}
