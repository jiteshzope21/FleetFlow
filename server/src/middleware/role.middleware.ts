import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      errorResponse(
        res,
        `Forbidden: Your role (${req.user.role}) does not have permission to perform this action.`,
        403
      );
      return;
    }

    next();
  };
}
