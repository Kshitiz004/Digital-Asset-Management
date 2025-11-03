import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for user registration
 * Validates user input for registration
 */
export class RegisterDto {
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
    description: 'User role (optional, defaults to user)',
    enum: ['admin', 'user', 'viewer'],
    default: 'user',
    required: false,
  })
  @IsOptional()
  @IsIn(['admin', 'user', 'viewer'])
  roleName?: string;
}

