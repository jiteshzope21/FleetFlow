import { api } from '../lib/api.js';
import { IShipment, ApiResponse } from '../types/index.js';

export interface ShipmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
  priority?: string;
}

export const shipmentService = {
  async getShipments(params?: ShipmentQueryParams) {
    const res = await api.get<ApiResponse<{ shipments: IShipment[]; pagination: any }>>('/shipments', { params });
    return res.data.data;
  },

  async getShipmentById(id: string) {
    const res = await api.get<ApiResponse<IShipment>>(`/shipments/${id}`);
    return res.data.data;
  },

  async createShipment(data: any) {
    const res = await api.post<ApiResponse<IShipment>>('/shipments', data);
    return res.data.data;
  },

  async updateShipment(id: string, data: any) {
    const res = await api.patch<ApiResponse<IShipment>>(`/shipments/${id}`, data);
    return res.data.data;
  },

  async confirmDelivery(id: string, data: { recipientName: string; recipientPhone?: string; notes?: string; podNumber?: string }) {
    const res = await api.post<ApiResponse<IShipment>>(`/shipments/${id}/confirm-delivery`, data);
    return res.data.data;
  },

  async archiveShipment(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/shipments/${id}`);
    return res.data;
  },
};
