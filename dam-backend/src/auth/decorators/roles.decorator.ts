import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator - Marks routes with required roles
 * Usage: @Roles('admin', 'user')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

