import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotaReservation extends Document {
  companyId: mongoose.Types.ObjectId;
  resource: 'vehicles' | 'users' | 'shipments';
  count: number;
  expiresAt: Date;
}

const QuotaReservationSchema = new Schema<IQuotaReservation>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  resource: { type: String, enum: ['vehicles', 'users', 'shipments'], required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: '5m' } }, // expires after 5 minutes
});

// Compound index for unique reservation per company/resource
QuotaReservationSchema.index({ companyId: 1, resource: 1 }, { unique: true });

export const QuotaReservation = mongoose.model<IQuotaReservation>('QuotaReservation', QuotaReservationSchema);

