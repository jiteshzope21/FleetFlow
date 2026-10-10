import { api } from '../lib/api.js';
import { IVehicle, ApiResponse } from '../types/index.js';

export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  fuelType?: string;
}

export const vehicleService = {
  async getVehicles(params?: VehicleQueryParams) {
    const res = await api.get<ApiResponse<{ vehicles: IVehicle[]; pagination: any }>>('/vehicles', { params });
    return res.data.data;
  },

  async getVehicleById(id: string) {
    const res = await api.get<ApiResponse<IVehicle>>(`/vehicles/${id}`);
    return res.data.data;
  },

  async createVehicle(data: Partial<IVehicle>) {
    const res = await api.post<ApiResponse<IVehicle>>('/vehicles', data);
    return res.data.data;
  },

  async updateVehicle(id: string, data: Partial<IVehicle>) {
    const res = await api.patch<ApiResponse<IVehicle>>(`/vehicles/${id}`, data);
    return res.data.data;
  },

  async archiveVehicle(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/vehicles/${id}`);
    return res.data;
  },
};
