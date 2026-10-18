import { api } from '../lib/api.js';
import { IFuelLog, ApiResponse } from '../types/index.js';

export interface FuelQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  driverId?: string;
  fuelType?: string;
}

export const fuelService = {
  async getFuelLogs(params?: FuelQueryParams) {
    const res = await api.get<
      ApiResponse<{
        logs: IFuelLog[];
        summary: {
          totalFuelCost: number;
          totalFuelQuantity: number;
          avgCostPerLiter: number;
        };
        pagination: any;
      }>
    >('/fuel', { params });
    return res.data.data;
  },

  async getFuelLogById(id: string) {
    const res = await api.get<ApiResponse<IFuelLog>>(`/fuel/${id}`);
    return res.data.data;
  },

  async createFuelLog(data: Partial<IFuelLog>) {
    const res = await api.post<ApiResponse<IFuelLog>>('/fuel', data);
    return res.data.data;
  },

  async updateFuelLog(id: string, data: Partial<IFuelLog>) {
    const res = await api.patch<ApiResponse<IFuelLog>>(`/fuel/${id}`, data);
    return res.data.data;
  },

  async archiveFuelLog(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/fuel/${id}`);
    return res.data;
  },

  async getLiveFuelPrice(city: string, fuelType: string = 'DIESEL') {
    const res = await api.get<ApiResponse<{
      city: string;
      matchedCity: string;
      fuelType: string;
      price: number;
      currency: string;
      unit: string;
      cached: boolean;
      timestamp: string;
      isEstimate: boolean;
    }>>('/fuel/live-price', {
      params: { city, fuelType },
    });
    return res.data.data;
  },

  async getLiveCities() {
    const res = await api.get<ApiResponse<{ name: string; value: string }[]>>('/fuel/live-cities');
    return res.data.data;
  },
};
