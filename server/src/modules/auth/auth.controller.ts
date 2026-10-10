import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { Company } from '../../models/Company.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.registerCompany(req.body);
      successResponse(res, result, 'Company and workspace registered successfully.', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      successResponse(res, result, 'Logged in successfully.', 200);
    } catch (err: any) {
      errorResponse(res, err.message, 401);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    // Client removes Bearer token; if cookies are used, clear cookie
    res.clearCookie('fleetflow_token');
    successResponse(res, { loggedOut: true }, 'Logged out successfully.');
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'Not authenticated', 401);
        return;
      }

      let company = null;
      if (req.user.companyId) {
        company = await Company.findById(req.user.companyId);
      }

      successResponse(res, {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          companyId: req.user.companyId,
          status: req.user.status,
          phone: req.user.phone,
          lastLoginAt: req.user.lastLoginAt,
          createdAt: req.user.createdAt,
        },
        company: company
          ? {
              id: company._id,
              name: company.name,
              slug: company.slug,
              email: company.email,
              phone: company.phone,
              address: company.address,
              businessType: company.businessType,
              status: company.status,
              settings: company.settings,
              createdAt: company.createdAt,
            }
          : null,
      });
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      successResponse(res, result, result.message);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body);
      successResponse(res, result, result.message);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }
}
