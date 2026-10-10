import { Request, Response } from 'express';
import { SupportService } from './support.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class SupportController {
  static async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const tickets = await SupportService.getCompanyTickets(req.companyId!);
      successResponse(res, tickets, 'Support tickets retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await SupportService.getTicketById(req.companyId!, req.params.id);
      successResponse(res, ticket, 'Ticket details retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 404);
    }
  }

  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await SupportService.createTicket(req.companyId!, req.user!, req.body);
      successResponse(res, ticket, 'Support ticket submitted.', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async replyTicket(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await SupportService.replyTicket(req.companyId!, req.params.id, req.body.message, req.user!);
      successResponse(res, ticket, 'Reply added to ticket.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }
}
