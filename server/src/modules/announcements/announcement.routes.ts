import { Router } from 'express';
import { Announcement } from '../../models/Announcement.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const tenantAnnouncementRouter = Router();

tenantAnnouncementRouter.use(authenticate);

tenantAnnouncementRouter.get('/', async (_req, res) => {
  try {
    const list = await Announcement.find({ isPublished: true }).sort({ createdAt: -1 }).limit(10).lean();
    successResponse(res, list, 'Published announcements retrieved.');
  } catch (err: any) {
    errorResponse(res, err.message, 500);
  }
});
