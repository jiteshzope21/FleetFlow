import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

/**
 * Tenant Isolation Middleware
 * Enforces that non-SUPER_ADMIN requests are bound strictly to the authenticated user's companyId.
 */
export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    errorResponse(res, 'Authentication required before tenant context check.', 401);
    return;
  }

  // Super Admin can access platform-level operations
  if (req.user.role === 'SUPER_ADMIN') {
    if (req.headers['x-tenant-id']) {
      try {
        req.companyId = new mongoose.Types.ObjectId(req.headers['x-tenant-id'] as string);
      } catch {
        errorResponse(res, 'Invalid x-tenant-id header format.', 400);
        return;
      }
    }
    return next();
  }

  // For all company-tier users, companyId MUST exist and be attached to their profile
  if (!req.user.companyId) {
    errorResponse(res, 'User does not belong to any transport company workspace.', 403);
    return;
  }

  req.companyId = req.user.companyId;
  next();
}
