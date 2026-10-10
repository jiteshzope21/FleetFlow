import { api } from '../lib/api.js';
import { ApiResponse, ICompany } from '../types/index.js';

export const companyService = {
  getProfile: async () => {
    const res = await api.get<ApiResponse<ICompany>>('/company/profile');
    return res.data;
  },
  updateProfile: async (data: Partial<ICompany>) => {
    const res = await api.patch<ApiResponse<ICompany>>('/company/profile', data);
    return res.data;
  },
};
