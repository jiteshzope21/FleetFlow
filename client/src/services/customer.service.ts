import { api } from '../lib/api.js';
import { ICustomer, ApiResponse } from '../types/index.js';

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
}

export const customerService = {
  async getCustomers(params?: CustomerQueryParams) {
    const res = await api.get<ApiResponse<{ customers: ICustomer[]; pagination: any }>>('/customers', { params });
    return res.data.data;
  },

  async getCustomerById(id: string) {
    const res = await api.get<ApiResponse<ICustomer>>(`/customers/${id}`);
    return res.data.data;
  },

  async createCustomer(data: Partial<ICustomer>) {
    const res = await api.post<ApiResponse<ICustomer>>('/customers', data);
    return res.data.data;
  },

  async updateCustomer(id: string, data: Partial<ICustomer>) {
    const res = await api.patch<ApiResponse<ICustomer>>(`/customers/${id}`, data);
    return res.data.data;
  },

  async archiveCustomer(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/customers/${id}`);
    return res.data;
  },
};
