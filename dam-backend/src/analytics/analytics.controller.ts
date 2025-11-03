import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Analytics Controller - Provides analytics endpoints
 * Protected by JWT authentication and RBAC
 */
@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Get admin analytics
   * Admin role: System-wide statistics
   */
  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Get admin analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin analytics retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAdminAnalytics() {
    return this.analyticsService.getAdminAnalytics();
  }

  /**
   * Get user analytics
   * User role: Personal statistics
   */
  @Get('user')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved' })
  async getUserAnalytics(@Req() req) {
    return this.analyticsService.getUserAnalytics(req.user.userId);
  }
}
