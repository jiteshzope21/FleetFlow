import { Request, Response } from 'express';
import { ShipmentService } from './shipment.service.js';
import {
  CreateShipmentSchema,
  UpdateShipmentSchema,
  ConfirmDeliverySchema,
  QueryShipmentSchema,
} from './shipment.validator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ShipmentController {
  static async create(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = CreateShipmentSchema.parse(req.body);
      const shipment = await ShipmentService.createShipment(req.user.companyId, validated);
      return successResponse(res, shipment, 'Shipment created successfully', 201);
    } catch (err: any) {
      const status = err.statusCode || (err.message?.includes('not found') ? 404 : 400);
      return errorResponse(res, err.message || 'Failed to create shipment', status);
    }
  }

  static async list(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const query = QueryShipmentSchema.parse(req.query);
      const result = await ShipmentService.getShipments(req.user.companyId, query);
      return successResponse(res, result, 'Shipments retrieved successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to list shipments', err.statusCode || 400);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const shipment = await ShipmentService.getShipmentById(req.user.companyId, req.params.id);
      return successResponse(res, shipment, 'Shipment retrieved successfully');
    } catch (err: any) {
      const status = err.statusCode || (err.message?.includes('not found') ? 404 : 400);
      return errorResponse(res, err.message || 'Failed to get shipment', status);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = UpdateShipmentSchema.parse(req.body);
      const shipment = await ShipmentService.updateShipment(req.user.companyId, req.params.id, validated);
      return successResponse(res, shipment, 'Shipment updated successfully');
    } catch (err: any) {
      const status = err.statusCode || (err.message?.includes('not found') ? 404 : 400);
      return errorResponse(res, err.message || 'Failed to update shipment', status);
    }
  }

  static async confirmDelivery(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = ConfirmDeliverySchema.parse(req.body);
      const shipment = await ShipmentService.confirmDelivery(req.user.companyId, req.params.id, validated);
      return successResponse(res, shipment, 'Delivery confirmed successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to confirm delivery', err.statusCode || 400);
    }
  }

  static async archive(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      await ShipmentService.archiveShipment(req.user.companyId, req.params.id);
      return successResponse(res, { message: 'Shipment archived successfully' }, 'Shipment archived');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to archive shipment', err.statusCode || 400);
    }
  }
}
