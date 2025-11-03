import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { User } from '../entities/user.entity';

/**
 * Users Controller - Handles user management endpoints
 * Admin only routes
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users
   * Admin role: List all users in the system
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  /**
   * Create new user
   * Admin role: Create users with specific roles
   */
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
      roleName: string;
      createdAt: Date;
    };
  }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const user = (await this.usersService.createUser(createUserDto)) as User;
    return {
      message: 'User created successfully',
      user: {
        id: user.id,

        email: user.email,

        name: user.name,

        roleName: user.roleName,

        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Update user role
   * Admin role: Change user's role (user, admin, viewer)
   */
  @Put(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roleName: {
          type: 'string',
          enum: ['admin', 'user', 'viewer'],
          description: 'New role name',
        },
      },
      required: ['roleName'],
    },
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { roleName: string },
  ): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
      roleName: string;
    };
  }> {
    const user = await this.usersService.updateUserRole(id, body.roleName);
    return {
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleName: user.roleName,
      },
    };
  }

  /**
   * Delete user
   * Admin role: Delete any user from the system
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
