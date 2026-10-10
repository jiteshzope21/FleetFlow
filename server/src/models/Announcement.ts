import mongoose, { Document, Schema } from 'mongoose';

export type AnnouncementPriority = 'NORMAL' | 'HIGH' | 'CRITICAL';
export type AnnouncementAudience = 'ALL' | 'OWNERS' | 'DISPATCHERS';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementAudience;
  isPublished: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'OWNERS', 'DISPATCHERS'],
      default: 'ALL',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
