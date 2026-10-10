import mongoose from 'mongoose';
import { Notification, INotification } from '../../models/Notification.js';

export class NotificationService {
  static async getNotifications(companyId?: mongoose.Types.ObjectId, userId?: mongoose.Types.ObjectId): Promise<INotification[]> {
    const filter: Record<string, any> = {};
    if (companyId) filter.companyId = companyId;
    if (userId) filter.$or = [{ userId }, { userId: null }, { userId: { $exists: false } }];

    return Notification.find(filter).sort({ createdAt: -1 }).limit(20);
  }

  static async markAsRead(notificationId: string): Promise<INotification | null> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) throw new Error('Invalid notification ID.');
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }

  static async markAllAsRead(companyId?: mongoose.Types.ObjectId, userId?: mongoose.Types.ObjectId) {
    const filter: Record<string, any> = {};
    if (companyId) filter.companyId = companyId;
    if (userId) filter.$or = [{ userId }, { userId: null }];

    await Notification.updateMany(filter, { isRead: true });
    return { success: true };
  }

  static async createNotification(data: {
    companyId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type?: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
    link?: string;
  }): Promise<INotification> {
    const notif = new Notification({
      ...data,
      type: data.type || 'INFO',
    });
    return notif.save();
  }
}
