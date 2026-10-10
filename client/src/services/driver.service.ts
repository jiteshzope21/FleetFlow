import { api } from '../lib/api.js';
import { IDriver, ApiResponse } from '../types/index.js';

export interface DriverQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const driverService = {
  async getDrivers(params?: DriverQueryParams) {
    const res = await api.get<ApiResponse<{ drivers: IDriver[]; pagination: any }>>('/drivers', { params });
    return res.data.data;
  },

  async getDriverById(id: string) {
    const res = await api.get<ApiResponse<IDriver>>(`/drivers/${id}`);
    return res.data.data;
  },

  async createDriver(data: Partial<IDriver>) {
    const res = await api.post<ApiResponse<IDriver>>('/drivers', data);
    return res.data.data;
  },

  async updateDriver(id: string, data: Partial<IDriver>) {
    const res = await api.patch<ApiResponse<IDriver>>(`/drivers/${id}`, data);
    return res.data.data;
  },

  async archiveDriver(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/drivers/${id}`);
    return res.data;
  },
};
