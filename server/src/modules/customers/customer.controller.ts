import { Request, Response } from 'express';
import { CustomerService } from './customer.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class CustomerController {
  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const data = await CustomerService.getCustomers(req.companyId, req.query as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const customer = await CustomerService.getCustomerById(req.companyId, req.params.id);
      successResponse(res, customer);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const customer = await CustomerService.createCustomer(req.companyId, req.body);
      successResponse(res, customer, 'Customer created successfully', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      const customer = await CustomerService.updateCustomer(req.companyId, req.params.id, req.body);
      successResponse(res, customer);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }
      await CustomerService.archiveCustomer(req.companyId, req.params.id);
      successResponse(res, { message: 'Customer archived successfully.' });
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }
}
