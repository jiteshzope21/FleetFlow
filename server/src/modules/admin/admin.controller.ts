import { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { logger } from '../../utils/logger.js';

export class AdminController {
  static async bootstrap(req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.bootstrapSuperAdmin(req.body);
      successResponse(res, result, 'Super Admin initialized successfully.', 201);
    } catch (err: any) {
      logger.warn(`[AdminController.bootstrap] Rejection: ${err.message}`);
      errorResponse(res, err.message, 400);
    }
  }

  static async getOverview(_req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getOverview();
      successResponse(res, data, 'Platform overview metrics retrieved successfully.');
    } catch (err: any) {
      logger.error('[AdminController.getOverview] Error:', err);
      errorResponse(res, `Failed to retrieve overview: ${err.message}`, 500);
    }
  }

  static async getCompanies(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getCompanies(req.query as any);
      successResponse(res, data, 'Platform companies retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getCompanyDetails(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getCompanyDetails(req.params.id);
      successResponse(res, data, 'Company details retrieved.');
    } catch (err: any) {
      const status = err.message === 'Company not found.' ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async updateCompanyStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status, reason } = req.body;
      const updated = await AdminService.updateCompanyStatus(req.params.id, status, reason, req.user);
      successResponse(res, updated, `Company status updated to ${status}.`);
    } catch (err: any) {
      const status = err.message === 'Company not found.' ? 404 : 400;
      errorResponse(res, err.message, status);
    }
  }

  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getUsers(req.query as any);
      successResponse(res, data, 'Platform users retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status, reason } = req.body;
      const updated = await AdminService.updateUserStatus(req.params.id, status, reason, req.user);
      successResponse(res, updated, `User status updated to ${status}.`);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getPlans(_req: Request, res: Response): Promise<void> {
    try {
      const plans = await AdminService.getPlans();
      successResponse(res, plans, 'Subscription plans retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await AdminService.createPlan(req.body, req.user);
      successResponse(res, plan, 'Subscription plan created.', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await AdminService.updatePlan(req.params.id, req.body, req.user);
      successResponse(res, plan, 'Subscription plan updated.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getSubscriptions(req.query as any);
      successResponse(res, data, 'Subscriptions retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateSubscription(req.params.id, req.body, req.user);
      successResponse(res, updated, 'Subscription updated.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getAnalytics(_req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getAnalytics();
      successResponse(res, data, 'Platform analytics retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getAiMonitoring(_req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getAiMonitoring();
      successResponse(res, data, 'AI/ML monitoring telemetry retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getSupportTickets(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getSupportTickets(req.query as any);
      successResponse(res, data, 'Support tickets retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async updateSupportTicket(req: Request, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateSupportTicket(req.params.id, req.body, req.user);
      successResponse(res, updated, 'Support ticket updated.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async addTicketReply(req: Request, res: Response): Promise<void> {
    try {
      const updated = await AdminService.addTicketReply(req.params.id, req.body.message, req.user!);
      successResponse(res, updated, 'Reply added to support ticket.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getAnnouncements(_req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getAnnouncements();
      successResponse(res, data, 'Platform announcements retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const created = await AdminService.createAnnouncement(req.body, req.user);
      successResponse(res, created, 'Announcement published.', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateAnnouncement(req.params.id, req.body, req.user);
      successResponse(res, updated, 'Announcement updated.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.deleteAnnouncement(req.params.id, req.user);
      successResponse(res, result, 'Announcement deleted.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getAuditLogs(req.query as any);
      successResponse(res, data, 'Audit logs retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getSystemHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await AdminService.getSystemHealth();
      successResponse(res, health, 'System health diagnostics retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async getSettings(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await AdminService.getSettings();
      successResponse(res, settings, 'Platform settings retrieved.');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateSettings(req.body.settings || req.body, req.user);
      successResponse(res, updated, 'Platform settings updated.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }
}
