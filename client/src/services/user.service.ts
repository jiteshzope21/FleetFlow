import { api } from '../lib/api.js';
import { ApiResponse, IUser } from '../types/index.js';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const userService = {
  getUsers: async (params?: UserQueryParams) => {
    const res = await api.get<ApiResponse<IUser[]>>('/users', { params });
    return res.data;
  },
  getUserById: async (id: string) => {
    const res = await api.get<ApiResponse<IUser>>(`/users/${id}`);
    return res.data;
  },
  createUser: async (data: any) => {
    const res = await api.post<ApiResponse<IUser>>('/users', data);
    return res.data;
  },
  updateUser: async (id: string, data: any) => {
    const res = await api.patch<ApiResponse<IUser>>(`/users/${id}`, data);
    return res.data;
  },
  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const res = await api.patch<ApiResponse<IUser>>(`/users/${id}/status`, { status });
    return res.data;
  },
};
