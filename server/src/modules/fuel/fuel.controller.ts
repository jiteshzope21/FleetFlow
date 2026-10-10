import { Request, Response } from 'express';
import { FuelService } from './fuel.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class FuelController {
  static async getFuelLogs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await FuelService.getFuelLogs(req.companyId, req.query as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getFuelLogById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const log = await FuelService.getFuelLogById(req.companyId, req.params.id);
      successResponse(res, log);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async createFuelLog(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const log = await FuelService.createFuelLog(req.companyId, req.body);
      successResponse(res, log, 'Fuel log created successfully', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateFuelLog(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const log = await FuelService.updateFuelLog(req.companyId, req.params.id, req.body);
      successResponse(res, log);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async deleteFuelLog(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      await FuelService.archiveFuelLog(req.companyId, req.params.id);
      successResponse(res, { message: 'Fuel log record archived successfully.' });
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }
}
