import mongoose, { Document, Schema } from 'mongoose';

export interface IAITelemetry extends Document {
  endpoint: string;
  companyId?: mongoose.Types.ObjectId;
  durationMs: number;
  success: boolean;
  usedFallback: boolean;
  modelVersion: string;
  error?: string;
  createdAt: Date;
}

const AITelemetrySchema = new Schema<IAITelemetry>(
  {
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    durationMs: {
      type: Number,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    usedFallback: {
      type: Boolean,
      required: true,
      index: true,
    },
    modelVersion: {
      type: String,
      default: '1.0.0',
    },
    error: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AITelemetry = mongoose.model<IAITelemetry>('AITelemetry', AITelemetrySchema);
