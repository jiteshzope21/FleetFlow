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
  data: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    totalPages?: number;
  };
}

// ---------------------------------------------------------------------------
// Phase 2 Operational Models
// ---------------------------------------------------------------------------

export type VehicleType = 'TRUCK' | 'TRAILER' | 'VAN' | 'TANKER' | 'CONTAINER' | 'OTHER';
export type FuelType = 'DIESEL' | 'PETROL' | 'CNG' | 'ELECTRIC' | 'HYBRID' | 'LNG';
export type VehicleStatus = 'ACTIVE' | 'IN_MAINTENANCE' | 'INACTIVE';

export interface IVehicle {
  _id: string;
  companyId: string;
  registrationNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  currentOdometer: number;
  status: VehicleStatus;
  assignedDriverId?: {
    _id: string;
    name: string;
    phone: string;
    licenseNumber: string;
    status: string;
  } | null;
  purchaseDate?: string;
  purchasePrice?: number;
  insuranceExpiryDate?: string;
  registrationExpiryDate?: string;
  pollutionExpiryDate?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface IDriver {
  _id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  address?: string;
  dateOfJoining?: string;
  status: DriverStatus;
  assignedVehicleId?: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
    status: string;
  } | null;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 'CORPORATE' | 'INDIVIDUAL' | 'FORWARDER' | 'RETAIL';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface ICustomer {
  _id: string;
  companyId: string;
  name: string;
  customerType: CustomerType;
  contactPerson: string;
  phone: string;
  email?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
  paymentTerms?: string;
  status: CustomerStatus;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType =
  | 'ROUTINE_SERVICE'
  | 'REPAIR'
  | 'INSPECTION'
  | 'TIRE_REPLACEMENT'
  | 'OIL_CHANGE'
  | 'BRAKE_SERVICE'
  | 'ACCIDENT_REPAIR'
  | 'OTHER';

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IMaintenance {
  _id: string;
  companyId: string;
  vehicleId: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
    status: string;
    currentOdometer: number;
  };
  serviceType: MaintenanceType;
  description: string;
  serviceDate: string;
  odometerAtService?: number;
  serviceProvider?: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  nextServiceDate?: string;
  nextServiceOdometer?: number;
  status: MaintenanceStatus;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFuelLog {
  _id: string;
  companyId: string;
  vehicleId: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
    currentOdometer: number;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  refuelingDate: string;
  fuelType: FuelType;
  quantity: number;
  pricePerUnit?: number;
  totalCost: number;
  odometer: number;
  fuelStation?: string;
  invoiceNumber?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'TOLLS'
  | 'PARKING'
  | 'PERMITS'
  | 'INSURANCE'
  | 'TAXES'
  | 'OFFICE_SUPPLIES'
  | 'UTILITIES'
  | 'SALARIES'
  | 'DRIVER_ALLOWANCE'
  | 'LODGING'
  | 'MISCELLANEOUS';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHECK' | 'OTHER';

export interface IExpense {
  _id: string;
  companyId: string;
  title: string;
  category: ExpenseCategory;
  expenseDate: string;
  amount: number;
  currency: string;
  vehicleId?: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
  } | null;
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  customerId?: {
    _id: string;
    name: string;
    contactPerson: string;
  } | null;
  vendor?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

