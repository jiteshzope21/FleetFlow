import mongoose, { Document, Schema } from 'mongoose';

export const USER_ROLES = [
  'SUPER_ADMIN',
  'COMPANY_OWNER',
  'MANAGER',
  'DISPATCHER',
  'ACCOUNTANT',
  'FLEET_MANAGER',
  'MAINTENANCE_MANAGER',
  'DRIVER',
  'VIEWER',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  companyId?: mongoose.Types.ObjectId | null;
  status: UserStatus;
  phone?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'VIEWER',
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any).passwordHash;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound index for tenant user queries
UserSchema.index({ companyId: 1, role: 1 });
UserSchema.index({ companyId: 1, status: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
