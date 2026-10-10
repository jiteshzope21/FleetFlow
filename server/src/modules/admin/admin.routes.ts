import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  bootstrapAdminSchema,
  updateCompanyStatusSchema,
  updateUserStatusSchema,
  createPlanSchema,
  updatePlanSchema,
  updateSubscriptionSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  createTicketReplySchema,
  updateTicketStatusSchema,
  updateSettingsSchema,
} from './admin.validator.js';

export const adminRouter = Router();

// Public / Controlled Bootstrap Route
adminRouter.post('/bootstrap', validate(bootstrapAdminSchema), AdminController.bootstrap);

// All subsequent platform admin routes require authentication and SUPER_ADMIN role
adminRouter.use(authenticate, requireRole('SUPER_ADMIN'));

// Platform Overview
adminRouter.get('/overview', AdminController.getOverview);

// Companies Management
adminRouter.get('/companies', AdminController.getCompanies);
adminRouter.get('/companies/:id', AdminController.getCompanyDetails);
adminRouter.patch('/companies/:id/status', validate(updateCompanyStatusSchema), AdminController.updateCompanyStatus);

// Platform Users Management
adminRouter.get('/users', AdminController.getUsers);
adminRouter.patch('/users/:id/status', validate(updateUserStatusSchema), AdminController.updateUserStatus);

// Subscription Plans
adminRouter.get('/plans', AdminController.getPlans);
adminRouter.post('/plans', validate(createPlanSchema), AdminController.createPlan);
adminRouter.put('/plans/:id', validate(updatePlanSchema), AdminController.updatePlan);

// Subscriptions
adminRouter.get('/subscriptions', AdminController.getSubscriptions);
adminRouter.patch('/subscriptions/:id', validate(updateSubscriptionSchema), AdminController.updateSubscription);

// Platform Analytics
adminRouter.get('/analytics', AdminController.getAnalytics);

// AI/ML Telemetry & Monitoring
adminRouter.get('/ai-monitoring', AdminController.getAiMonitoring);

// Support Tickets
adminRouter.get('/support', AdminController.getSupportTickets);
adminRouter.patch('/support/:id', validate(updateTicketStatusSchema), AdminController.updateSupportTicket);
adminRouter.post('/support/:id/reply', validate(createTicketReplySchema), AdminController.addTicketReply);

// Platform Announcements
adminRouter.get('/announcements', AdminController.getAnnouncements);
adminRouter.post('/announcements', validate(createAnnouncementSchema), AdminController.createAnnouncement);
adminRouter.patch('/announcements/:id', validate(updateAnnouncementSchema), AdminController.updateAnnouncement);
adminRouter.delete('/announcements/:id', AdminController.deleteAnnouncement);

// Audit Logs
adminRouter.get('/audit-logs', AdminController.getAuditLogs);

// System Health
adminRouter.get('/health', AdminController.getSystemHealth);

// Platform Settings
adminRouter.get('/settings', AdminController.getSettings);
adminRouter.patch('/settings', validate(updateSettingsSchema), AdminController.updateSettings);
