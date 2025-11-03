import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Roles Guard - Implements Role-Based Access Control (RBAC)
 * Checks if user's role matches required roles for the route
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from route metadata (set by @Roles decorator)
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    // If no roles specified, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user from request (attached by JWT strategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists and has required role
    return user && requiredRoles.includes(user.role);
  }
}

