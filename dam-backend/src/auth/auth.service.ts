import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

/**
 * Auth Service - Handles user authentication and authorization
 * Responsibilities:
 * - User registration with password hashing
 * - User login with password verification
 * - JWT token generation
 * - Google OAuth user creation
 */
@Injectable()
export class AuthService {
  constructor(
    // Inject User repository for database operations
    @InjectRepository(User)
    private userRepository: Repository<User>,

    // Inject Role repository for role management
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    // Inject JWT service for token generation
    private jwtService: JwtService,

    // Inject config service for environment variables
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user with email/password
   * Flow:
   * 1. Check if user already exists
   * 2. Hash the password
   * 3. Assign default 'user' role
   * 4. Save to database
   * 5. Return JWT token
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; access_token: string }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Validate and get role (default to 'user' if not provided)
    const roleName = registerDto.roleName || 'user';
    const validRoles = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(roleName)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    // Get or create role
    let userRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!userRole) {
      userRole = this.roleRepository.create({
        name: roleName,
        description: `${roleName} role`,
      });
      await this.roleRepository.save(userRole);
    }

    // Create new user
    const user = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      roleName: roleName,
    });

    // Save to database
    await this.userRepository.save(user);

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.roleName };
    const access_token = this.jwtService.sign(payload);

    // Return user info (without password) and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      access_token,
    };
  }

  /**
   * Login existing user with email/password
   * Flow:
   * 1. Find user by email
   * 2. Verify password matches
   * 3. Return JWT token
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; access_token: string }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.roleName };
    const access_token = this.jwtService.sign(payload);

    // Return user info (without password) and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      access_token,
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Create or update user from Google OAuth
   * Flow:
   * 1. Check if user exists by email
   * 2. If exists, update Google ID and profile picture
   * 3. If not, create new user with 'user' role
   * 4. Return user info and JWT token
   */
  async googleLogin(userProfile: {
    id: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<{ user: Partial<User>; access_token: string }> {
    // Find user by email
    let user = await this.userRepository.findOne({
      where: { email: userProfile.email },
    });

    // Get or create 'user' role
    let userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    });
    if (!userRole) {
      userRole = this.roleRepository.create({
        name: 'user',
        description: 'Regular user with upload and manage permissions',
      });
      await this.roleRepository.save(userRole);
    }

    if (user) {
      // Update existing user with Google info
      user.googleId = userProfile.id;
      user.profilePicture = userProfile.picture;
      await this.userRepository.save(user);
    } else {
      // Create new user
      user = this.userRepository.create({
        email: userProfile.email,
        name: userProfile.name,
        googleId: userProfile.id,
        profilePicture: userProfile.picture,
        roleName: 'user',
      });
      await this.userRepository.save(user);
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.roleName };
    const access_token = this.jwtService.sign(payload);

    // Return user info (without password) and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      access_token,
    };
  }
}
