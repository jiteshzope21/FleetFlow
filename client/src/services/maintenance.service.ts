import { api } from '../lib/api.js';
import { IMaintenance, ApiResponse } from '../types/index.js';

export interface MaintenanceQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  status?: string;
  serviceType?: string;
}

export const maintenanceService = {
  async getMaintenanceList(params?: MaintenanceQueryParams) {
    const res = await api.get<
      ApiResponse<{
        records: IMaintenance[];
        totalMaintenanceExpenditure: number;
        pagination: any;
      }>
    >('/maintenance', { params });
    return res.data.data;
  },

  async getMaintenanceById(id: string) {
    const res = await api.get<ApiResponse<IMaintenance>>(`/maintenance/${id}`);
    return res.data.data;
  },

  async createMaintenance(data: Partial<IMaintenance>) {
    const res = await api.post<ApiResponse<IMaintenance>>('/maintenance', data);
    return res.data.data;
  },

  async updateMaintenance(id: string, data: Partial<IMaintenance>) {
    const res = await api.patch<ApiResponse<IMaintenance>>(`/maintenance/${id}`, data);
    return res.data.data;
  },

  async archiveMaintenance(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/maintenance/${id}`);
    return res.data;
  },
};
