import { api } from '../lib/api.js';
import { ApiResponse, IUser, ICompany } from '../types/index.js';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<ApiResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post<ApiResponse>('/auth/register', data);
    return res.data;
  },
  logout: async () => {
    const res = await api.post<ApiResponse>('/auth/logout');
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<ApiResponse<{ user: IUser; company: ICompany }>>('/auth/me');
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await api.post<ApiResponse>('/auth/reset-password', data);
    return res.data;
  },
};
