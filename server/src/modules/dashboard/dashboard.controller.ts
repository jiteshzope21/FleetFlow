import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class DashboardController {
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await DashboardService.getOverview(req.companyId);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const activity = await DashboardService.getActivity(req.companyId);
      successResponse(res, activity);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }
}
