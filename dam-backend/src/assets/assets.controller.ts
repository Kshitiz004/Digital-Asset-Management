import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Assets Controller - Handles asset management endpoints
 * Protected by JWT authentication and RBAC
 */
@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  /**
   * Upload new asset
   * User role: Can upload assets
   */
  @Post()
  @Roles('user', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        tags: {
          type: 'string',
          example: 'vacation,summer',
        },
        description: {
          type: 'string',
          example: 'Summer vacation photos',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a new asset' })
  @ApiResponse({ status: 201, description: 'Asset uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body('tags') tags: string,
    @Body('description') description: string,
    @Req() req,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    return this.assetsService.uploadAsset(
      file,
      req.user.userId,
      req.user.email,
      tags,
      description,
    );
  }

  /**
   * Get user's assets
   * User role: Can view own assets
   * Viewer role: Can only view shared assets
   */
  @Get()
  @Roles('user', 'admin', 'viewer')
  @ApiOperation({ summary: 'Get user assets' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  async getUserAssets(@Req() req, @Query('assetType') assetType?: string) {
    // Viewer role can only see shared assets
    if (req.user.role === 'viewer') {
      return this.assetsService.getSharedAssets(assetType);
    }
    // User and admin see their own assets
    return this.assetsService.getUserAssets(req.user.userId, assetType);
  }

  /**
   * Get all assets (admin only)
   */
  @Get('all')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all assets (Admin only)' })
  @ApiResponse({ status: 200, description: 'All assets retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAllAssets(@Query('assetType') assetType?: string) {
    return this.assetsService.getAllAssets(assetType);
  }

  /**
   * Get asset by ID
   * Viewer role: Can only view shared assets
   */
  @Get(':id')
  @Roles('user', 'admin', 'viewer')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not shared or not owner' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async getAsset(@Param('id') id: string, @Req() req) {
    const asset = await this.assetsService.getAssetById(id);
    
    // Viewer role can only view shared assets
    if (req.user.role === 'viewer' && !asset.isShared) {
      throw new ForbiddenException('You can only view shared assets');
    }
    
    // User/admin can only view their own assets (unless admin)
    if (req.user.role !== 'admin' && asset.uploaderId !== req.user.userId && !asset.isShared) {
      throw new ForbiddenException('You do not have permission to view this asset');
    }
    
    return asset;
  }

  /**
   * Get download URL for asset
   * Viewer role: Can only download shared assets
   */
  @Get(':id/download')
  @Roles('user', 'admin', 'viewer')
  @ApiOperation({ summary: 'Get download URL for asset' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not shared or not owner' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async getDownloadUrl(@Param('id') id: string, @Req() req) {
    // For viewer role, check if asset is shared
    if (req.user.role === 'viewer') {
      const asset = await this.assetsService.getAssetById(id);
      if (!asset.isShared) {
        throw new ForbiddenException('You can only download shared assets');
      }
    }
    return this.assetsService.getDownloadUrl(
      id,
      req.user.userId,
      req.user.email,
      req.user.role,
    );
  }

  /**
   * Update asset metadata
   * User role: Can update own assets
   */
  @Put(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Update asset metadata' })
  @ApiResponse({ status: 200, description: 'Asset updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async updateAsset(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssetDto,
    @Req() req,
  ) {
    return this.assetsService.updateAsset(
      id,
      req.user.userId,
      req.user.email,
      updateDto,
    );
  }

  /**
   * Delete asset
   * User role: Can delete own assets
   */
  @Delete(':id')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Delete asset' })
  @ApiResponse({ status: 200, description: 'Asset deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async deleteAsset(@Param('id') id: string, @Req() req) {
    await this.assetsService.deleteAsset(
      id,
      req.user.userId,
      req.user.email,
      req.user.role,
    );
    return { message: 'Asset deleted successfully' };
  }

  /**
   * Share asset publicly
   */
  @Post(':id/share')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Share asset publicly' })
  @ApiResponse({ status: 200, description: 'Asset shared' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async shareAsset(@Param('id') id: string, @Req() req) {
    return this.assetsService.shareAsset(id, req.user.userId, req.user.email);
  }

  /**
   * Get shared asset (no authentication required)
   * Public route - anyone with the ID can access
   */
  @Get('shared/:id')
  @Public()
  @ApiOperation({ summary: 'Get shared asset (Public)' })
  @ApiResponse({ status: 200, description: 'Shared asset retrieved' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async getSharedAsset(@Param('id') id: string) {
    return this.assetsService.getSharedAsset(id);
  }
}
