import { api } from '../lib/api.js';
import { ApiResponse } from '../types/index.js';

export const dashboardService = {
  getOverview: async () => {
    const res = await api.get<ApiResponse<any>>('/dashboard/overview');
    return res.data;
  },
  getActivity: async () => {
    const res = await api.get<ApiResponse<any[]>>('/dashboard/activity');
    return res.data;
  },
};
