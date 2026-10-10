import { Request, Response } from 'express';
import { DriverService } from './driver.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class DriverController {
  static async getDrivers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await DriverService.getDrivers(req.companyId, req.query as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getDriverById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const driver = await DriverService.getDriverById(req.companyId, req.params.id);
      successResponse(res, driver);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async createDriver(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const driver = await DriverService.createDriver(req.companyId, req.body);
      successResponse(res, driver, 'Driver created successfully', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateDriver(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const driver = await DriverService.updateDriver(req.companyId, req.params.id, req.body);
      successResponse(res, driver);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async deleteDriver(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      await DriverService.archiveDriver(req.companyId, req.params.id);
      successResponse(res, { message: 'Driver archived successfully.' });
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }
}
