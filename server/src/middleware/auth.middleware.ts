import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if ((req as any).cookies && (req as any).cookies.fleetflow_token) {
      token = (req as any).cookies.fleetflow_token;
    }

    if (!token) {
      errorResponse(res, 'Authentication required. Please log in.', 401);
      return;
    }

    let payload: any;
    try {
      payload = verifyAccessToken(token);
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
        return;
      }
      errorResponse(res, 'Invalid authentication token.', 401);
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      errorResponse(res, 'User account not found.', 401);
      return;
    }

    if (user.status !== 'ACTIVE') {
      errorResponse(res, 'Account is deactivated. Please contact your company administrator.', 403);
      return;
    }

    req.user = user;
    if (user.companyId) {
      req.companyId = user.companyId;
    }

    next();
  } catch (err: any) {
    errorResponse(res, `Authentication error: ${err.message}`, 500);
  }
}
