import { Request, Response } from 'express';
import { VehicleService } from './vehicle.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class VehicleController {
  static async getVehicles(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await VehicleService.getVehicles(req.companyId, req.query as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getVehicleById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const vehicle = await VehicleService.getVehicleById(req.companyId, req.params.id);
      successResponse(res, vehicle);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const vehicle = await VehicleService.createVehicle(req.companyId, req.body);
      successResponse(res, vehicle, 'Vehicle created successfully', 201);
    } catch (err: any) {
      const status = err.message.includes('already exists') ? 400 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const vehicle = await VehicleService.updateVehicle(req.companyId, req.params.id, req.body);
      successResponse(res, vehicle);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      await VehicleService.archiveVehicle(req.companyId, req.params.id);
      successResponse(res, { message: 'Vehicle archived successfully.' });
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }
}
