import { Request, Response } from 'express';
import { InvoiceService } from './invoice.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class InvoiceController {
  static async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const invoice = await InvoiceService.createInvoice(req.companyId!, req.body);
      successResponse(res, invoice, 'Invoice created successfully.', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const data = await InvoiceService.getInvoices(req.companyId!, req.query);
      successResponse(res, data, 'Invoices retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.companyId!, req.params.id);
      successResponse(res, invoice, 'Invoice details retrieved.');
    } catch (err: any) {
      const status = err.message === 'Invoice not found.' ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const updated = await InvoiceService.recordPayment(req.companyId!, req.params.id, req.body);
      successResponse(res, updated, 'Payment recorded successfully.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }
}
