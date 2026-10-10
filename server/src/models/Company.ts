import mongoose, { Document, Schema } from 'mongoose';

export type CompanyStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
export type BusinessType = 'LOGISTICS' | 'FREIGHT_FORWARDER' | 'TRUCKING' | 'FLEET_OPERATOR' | 'OTHER';

export interface ICompanySettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  distanceUnit: 'km' | 'miles';
  fuelUnit: 'liters' | 'gallons';
}

export interface ICompany extends Document {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  businessType: BusinessType;
  status: CompanyStatus;
  ownerId?: mongoose.Types.ObjectId;
  settings: ICompanySettings;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Company slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'USA' },
    },
    businessType: {
      type: String,
      enum: ['LOGISTICS', 'FREIGHT_FORWARDER', 'TRUCKING', 'FLEET_OPERATOR', 'OTHER'],
      default: 'LOGISTICS',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIAL', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    settings: {
      currency: { type: String, default: 'USD' },
      timezone: { type: String, default: 'UTC' },
      dateFormat: { type: String, default: 'YYYY-MM-DD' },
      distanceUnit: { type: String, enum: ['km', 'miles'], default: 'km' },
      fuelUnit: { type: String, enum: ['liters', 'gallons'], default: 'liters' },
    },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
