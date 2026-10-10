import { Request, Response } from 'express';
import { TripService } from './trip.service.js';
import {
  CreateTripSchema,
  UpdateTripSchema,
  StartTripSchema,
  CompleteTripSchema,
  QueryTripSchema,
} from './trip.validator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class TripController {
  static async create(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = CreateTripSchema.parse(req.body);
      const trip = await TripService.createTrip(req.user.companyId, validated);
      return successResponse(res, trip, 'Trip dispatched successfully', 201);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to dispatch trip', err.statusCode || 400);
    }
  }

  static async list(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const query = QueryTripSchema.parse(req.query);
      const result = await TripService.getTrips(req.user.companyId, query);
      return successResponse(res, result, 'Trips retrieved successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to list trips', err.statusCode || 400);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const trip = await TripService.getTripById(req.user.companyId, req.params.id);
      return successResponse(res, trip, 'Trip retrieved successfully');
    } catch (err: any) {
      const status = err.statusCode || (err.message?.includes('not found') ? 404 : 400);
      return errorResponse(res, err.message || 'Failed to get trip', status);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = UpdateTripSchema.parse(req.body);
      const trip = await TripService.updateTrip(req.user.companyId, req.params.id, validated);
      return successResponse(res, trip, 'Trip updated successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to update trip', err.statusCode || 400);
    }
  }

  static async start(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = StartTripSchema.parse(req.body);
      const trip = await TripService.startTrip(req.user.companyId, req.params.id, validated);
      return successResponse(res, trip, 'Trip marked in progress successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to start trip', err.statusCode || 400);
    }
  }

  static async complete(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const validated = CompleteTripSchema.parse(req.body);
      const trip = await TripService.completeTrip(req.user.companyId, req.params.id, validated);
      return successResponse(res, trip, 'Trip completed successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to complete trip', err.statusCode || 400);
    }
  }

  static async cancel(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const reason = req.body.reason ? String(req.body.reason) : undefined;
      const trip = await TripService.cancelTrip(req.user.companyId, req.params.id, reason);
      return successResponse(res, trip, 'Trip cancelled successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to cancel trip', err.statusCode || 400);
    }
  }

  static async archive(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      await TripService.archiveTrip(req.user.companyId, req.params.id);
      return successResponse(res, { message: 'Trip archived successfully' }, 'Trip archived');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to archive trip', err.statusCode || 400);
    }
  }
}
