import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator - Marks routes as public (no authentication required)
 * Usage: @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

