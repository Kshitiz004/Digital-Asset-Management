import type { Request } from 'express';
import type { User } from '../../entities/user.entity';

/**
 * Authenticated Request Interface
 * Extends Express Request with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    user: User;
  };
}
