import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Asset } from '../entities/asset.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { S3Service } from '../services/s3.service';

/**
 * Users Service - Manages user operations
 * Responsibilities:
 * - List all users
 * - Delete users
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private s3Service: S3Service,
  ) {}

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'roleName', 'createdAt'],
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create new user (Admin only)
   * Allows admins to create users with specific roles
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Validate and get role
    const roleName = createUserDto.roleName || 'user';
    const validRoles = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(roleName)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    // Get or create role
    let role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      role = this.roleRepository.create({
        name: roleName,
        description: `${roleName} role`,
      });
      await this.roleRepository.save(role);
    }

    // Create new user
    const user = this.userRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
      password: hashedPassword,
      roleName: roleName,
    });

    await this.userRepository.save(user);
    return user;
  }

  /**
   * Delete user by ID
   * First deletes all assets associated with the user (including files from storage)
   * Then deletes the user
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find all assets owned by this user
    const userAssets = await this.assetRepository.find({
      where: { uploaderId: userId },
    });

    // Delete all assets (files from storage and records from database)
    for (const asset of userAssets) {
      try {
        // Delete file from storage (S3 or local)
        await this.s3Service.deleteFile(asset.s3Key);
        // Delete asset record from database
        await this.assetRepository.remove(asset);
      } catch (error) {
        // Log error but continue with other assets
        console.error(`Failed to delete asset ${asset.id}:`, error);
      }
    }

    // Now delete the user
    await this.userRepository.remove(user);
  }

  /**
   * Update user role
   * Admin only - Change user's role (user, admin, viewer)
   */
  async updateUserRole(userId: string, roleName: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate role name
    const validRoles = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(roleName)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    user.roleName = roleName;
    await this.userRepository.save(user);

    return user;
  }
}
