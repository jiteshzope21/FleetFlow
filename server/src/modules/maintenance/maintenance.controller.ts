import { Request, Response } from 'express';
import { MaintenanceService } from './maintenance.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class MaintenanceController {
  static async getMaintenanceList(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await MaintenanceService.getMaintenanceList(req.companyId, req.query as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getMaintenanceById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const record = await MaintenanceService.getMaintenanceById(req.companyId, req.params.id);
      successResponse(res, record);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async createMaintenance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const record = await MaintenanceService.createMaintenance(req.companyId, req.body);
      successResponse(res, record, 'Maintenance record created successfully', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateMaintenance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const record = await MaintenanceService.updateMaintenance(req.companyId, req.params.id, req.body);
      successResponse(res, record);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async deleteMaintenance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      await MaintenanceService.archiveMaintenance(req.companyId, req.params.id);
      successResponse(res, { message: 'Maintenance record archived successfully.' });
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }
}
