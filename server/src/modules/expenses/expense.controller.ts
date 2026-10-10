import { Request, Response } from 'express';
import { ExpenseService } from './expense.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ExpenseController {
  static async getExpenses(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await ExpenseService.getExpenses(req.companyId, req.query as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getExpenseById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const expense = await ExpenseService.getExpenseById(req.companyId, req.params.id);
      successResponse(res, expense);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async createExpense(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const expense = await ExpenseService.createExpense(req.companyId, req.body);
      successResponse(res, expense, 'Expense created successfully', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const expense = await ExpenseService.updateExpense(req.companyId, req.params.id, req.body);
      successResponse(res, expense);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      await ExpenseService.archiveExpense(req.companyId, req.params.id);
      successResponse(res, { message: 'Expense record archived successfully.' });
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }
}
