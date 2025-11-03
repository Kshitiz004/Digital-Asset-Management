import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Asset } from '../entities/asset.entity';
import { S3Service } from '../services/s3.service';

/**
 * Users Module - Manages users
 */
@Module({
  imports: [
    // TypeORM: Import User, Role, and Asset entities
    TypeOrmModule.forFeature([User, Role, Asset]),
  ],
  controllers: [UsersController],
  providers: [UsersService, S3Service],
  exports: [UsersService],
})
export class UsersModule {}

