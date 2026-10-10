import { Request, Response } from 'express';
import { z } from 'zod';
import { AiService } from './ai.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const PredictCostSchema = z.object({
  distanceKm: z.number().positive('Distance must be positive'),
  cargoWeightKg: z.number().nonnegative('Weight must be non-negative'),
  vehicleType: z.string().optional(),
  fuelType: z.string().optional(),
  fuelPricePerLiter: z.number().positive('Fuel price must be positive').optional(),
});

export class AiController {
  static async getHealth(req: Request, res: Response) {
    try {
      const health = await AiService.checkAiHealth();
      return successResponse(res, health, 'AI Service health status');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to check AI health', 500);
    }
  }

  static async predictTripCost(req: Request, res: Response) {
    try {
      const validated = PredictCostSchema.parse(req.body);
      const prediction = await AiService.predictTripCost(validated);
      return successResponse(res, prediction, 'Trip cost predicted successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to predict trip cost', 400);
    }
  }

  static async getFleetInsights(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const insights = await AiService.getFleetInsights(req.user.companyId);
      return successResponse(res, insights, 'Fleet AI insights generated successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to generate fleet insights', 500);
    }
  }

  static async getRecommendations(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const recs = await AiService.getRecommendations(req.user.companyId);
      return successResponse(res, recs, 'Actionable AI recommendations retrieved successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to get recommendations', 500);
    }
  }

  static async dismissRecommendation(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const { id } = req.params;
      const result = AiService.dismissRecommendation(req.user.companyId, id);
      return successResponse(res, result, 'Recommendation dismissed');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to dismiss recommendation', 400);
    }
  }
}
