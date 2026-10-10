import { Request, Response } from 'express';
import { CompanyService } from './company.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class CompanyController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const company = await CompanyService.getProfile(req.companyId);
      successResponse(res, company);
    } catch (err: any) {
      errorResponse(res, err.message, 404);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const company = await CompanyService.updateProfile(req.companyId, req.body);
      successResponse(res, company, 'Company profile updated successfully.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }
}
