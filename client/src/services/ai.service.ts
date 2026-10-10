import { api } from '../lib/api.js';
import {
  ITripCostPrediction,
  IAIFleetInsights,
  IAIRecommendation,
  ApiResponse,
} from '../types/index.js';

export interface TripCostPredictParams {
  distanceKm: number;
  cargoWeightKg: number;
  vehicleType?: string;
  fuelType?: string;
  fuelPricePerLiter?: number;
}

export const aiService = {
  async getHealth() {
    const res = await api.get<ApiResponse<any>>('/ai/health');
    return res.data.data;
  },

  async predictTripCost(params: TripCostPredictParams) {
    const res = await api.post<ApiResponse<ITripCostPrediction>>('/ai/predict-trip-cost', params);
    return res.data.data;
  },

  async getFleetInsights() {
    const res = await api.get<ApiResponse<IAIFleetInsights>>('/ai/insights');
    return res.data.data;
  },

  async getRecommendations() {
    const res = await api.get<ApiResponse<{ count: number; recommendations: IAIRecommendation[] }>>(
      '/ai/recommendations'
    );
    return res.data.data;
  },

  async dismissRecommendation(id: string) {
    const res = await api.patch<ApiResponse<{ success: boolean; dismissed: string }>>(
      `/ai/recommendations/${id}/dismiss`
    );
    return res.data.data;
  },
};
