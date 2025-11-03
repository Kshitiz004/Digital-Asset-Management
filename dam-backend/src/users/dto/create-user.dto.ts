import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for admin user creation
 * Allows admins to create users with specific roles
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password (min 6 chars)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'User role',
    enum: ['admin', 'user', 'viewer'],
    default: 'user',
  })
  @IsOptional()
  @IsIn(['admin', 'user', 'viewer'])
  roleName?: string;
}
