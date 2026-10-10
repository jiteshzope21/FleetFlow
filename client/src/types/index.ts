export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_OWNER'
  | 'MANAGER'
  | 'DISPATCHER'
  | 'ACCOUNTANT'
  | 'FLEET_MANAGER'
  | 'MAINTENANCE_MANAGER'
  | 'DRIVER'
  | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type CompanyStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED';

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
  status: UserStatus;
  phone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICompany {
  _id?: string;
  id?: string;
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
  businessType: string;
  status: CompanyStatus;
  settings?: {
    currency: string;
    timezone: string;
    dateFormat: string;
    distanceUnit: 'km' | 'miles';
    fuelUnit: 'liters' | 'gallons';
  };
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    totalPages?: number;
  };
}
