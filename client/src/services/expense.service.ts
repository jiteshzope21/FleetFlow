import { api } from '../lib/api.js';
import { IExpense, ApiResponse } from '../types/index.js';

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  vehicleId?: string;
  driverId?: string;
  customerId?: string;
}

export const expenseService = {
  async getExpenses(params?: ExpenseQueryParams) {
    const res = await api.get<
      ApiResponse<{
        expenses: IExpense[];
        summary: {
          totalAmount: number;
          categorySummary: Record<string, number>;
        };
        pagination: any;
      }>
    >('/expenses', { params });
    return res.data.data;
  },

  async getExpenseById(id: string) {
    const res = await api.get<ApiResponse<IExpense>>(`/expenses/${id}`);
    return res.data.data;
  },

  async createExpense(data: Partial<IExpense>) {
    const res = await api.post<ApiResponse<IExpense>>('/expenses', data);
    return res.data.data;
  },

  async updateExpense(id: string, data: Partial<IExpense>) {
    const res = await api.patch<ApiResponse<IExpense>>(`/expenses/${id}`, data);
    return res.data.data;
  },

  async archiveExpense(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/expenses/${id}`);
    return res.data;
  },
};
