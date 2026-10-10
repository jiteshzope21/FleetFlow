import { api } from '../lib/api.js';
import { ITrip, ApiResponse } from '../types/index.js';

export interface TripQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleId?: string;
  driverId?: string;
}

export const tripService = {
  async getTrips(params?: TripQueryParams) {
    const res = await api.get<ApiResponse<{ trips: ITrip[]; pagination: any }>>('/trips', { params });
    return res.data.data;
  },

  async getTripById(id: string) {
    const res = await api.get<ApiResponse<ITrip>>(`/trips/${id}`);
    return res.data.data;
  },

  async createTrip(data: any) {
    const res = await api.post<ApiResponse<ITrip>>('/trips', data);
    return res.data.data;
  },

  async updateTrip(id: string, data: any) {
    const res = await api.patch<ApiResponse<ITrip>>(`/trips/${id}`, data);
    return res.data.data;
  },

  async startTrip(id: string, data?: { startOdometer?: number; actualDepartureDate?: string }) {
    const res = await api.post<ApiResponse<ITrip>>(`/trips/${id}/start`, data || {});
    return res.data.data;
  },

  async completeTrip(id: string, data: { endOdometer?: number; actualArrivalDate?: string; costBreakdown?: any; actualCost?: number; notes?: string }) {
    const res = await api.post<ApiResponse<ITrip>>(`/trips/${id}/complete`, data);
    return res.data.data;
  },

  async cancelTrip(id: string, reason?: string) {
    const res = await api.post<ApiResponse<ITrip>>(`/trips/${id}/cancel`, { reason });
    return res.data.data;
  },

  async archiveTrip(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/trips/${id}`);
    return res.data;
  },
};
