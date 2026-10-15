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

// ----------------- Phase 3: Shipments & Transport Operations ----------------- //

export type CargoCategory =
  | 'GENERAL'
  | 'FRAGILE'
  | 'PERISHABLE'
  | 'HAZARDOUS'
  | 'LIQUID'
  | 'HEAVY_MACHINERY'
  | 'PARCEL'
  | 'OTHER';

export type ShipmentPriority = 'STANDARD' | 'HIGH' | 'URGENT';

export type ShipmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface IShipmentLocation {
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface IDeliveryConfirmation {
  deliveredAt: string;
  recipientName: string;
  recipientPhone?: string;
  notes?: string;
  podNumber?: string;
}

export interface IShipment {
  _id: string;
  companyId: string;
  shipmentNumber: string;
  customerId: {
    _id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  } | null;
  origin: IShipmentLocation;
  destination: IShipmentLocation;
  cargoDescription: string;
  cargoCategory: CargoCategory;
  weightKg: number;
  volumeCbm?: number;
  priority: ShipmentPriority;
  status: ShipmentStatus;
  estimatedCost: number;
  agreedPrice: number;
  assignedVehicleId?: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
    type: string;
  } | null;
  assignedDriverId?: {
    _id: string;
    name: string;
    phone: string;
    licenseNumber: string;
  } | null;
  tripId?: {
    _id: string;
    tripNumber: string;
    status: string;
    originCity: string;
    destinationCity: string;
  } | null;
  pickupDate?: string;
  deliveryDate?: string;
  deliveryConfirmation?: IDeliveryConfirmation | null;
  specialInstructions?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------- Phase 3: Trips & Dispatch ----------------- //

export type TripStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type StopType = 'PICKUP' | 'DELIVERY' | 'WAYPOINT' | 'REST';

export interface ITripStop {
  stopNumber: number;
  locationName: string;
  address?: string;
  city: string;
  type: StopType;
  plannedTime?: string;
  actualTime?: string;
  notes?: string;
}

export interface ITripCostBreakdown {
  fuelCost?: number;
  tollCost?: number;
  driverAllowance?: number;
  maintenanceCost?: number;
  otherCost?: number;
}

export interface ITrip {
  _id: string;
  companyId: string;
  tripNumber: string;
  vehicleId: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
    type: string;
    fuelType?: string;
    currentOdometer: number;
    status: string;
  } | null;
  driverId: {
    _id: string;
    name: string;
    phone: string;
    licenseNumber: string;
    status: string;
  } | null;
  shipmentIds: Array<{
    _id: string;
    shipmentNumber: string;
    cargoDescription: string;
    weightKg: number;
    agreedPrice: number;
    status: string;
  }>;
  originCity: string;
  destinationCity: string;
  stops?: ITripStop[];
  status: TripStatus;
  plannedDepartureDate: string;
  plannedArrivalDate: string;
  actualDepartureDate?: string;
  actualArrivalDate?: string;
  startOdometer?: number;
  endOdometer?: number;
  estimatedDistanceKm: number;
  actualDistanceKm?: number;
  estimatedCost: number;
  actualCost?: number;
  costBreakdown?: ITripCostBreakdown;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------- Phase 3: Reports ----------------- //

export interface IOperationalSummary {
  shipments: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
  };
  trips: {
    total: number;
    completed: number;
    inProgress: number;
    totalDistanceKm: number;
  };
  financials: {
    totalRevenue: number;
    estimatedCost: number;
    actualCost: number;
    grossMargin: number;
    marginPercent: number;
  };
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    utilizationPercent: number;
  };
}

// ----------------- Phase 4: AI Intelligence ----------------- //

export interface ITripCostPrediction {
  success: boolean;
  predicted_cost: number;
  currency: string;
  cost_breakdown: {
    fuel_cost: number;
    toll_charges: number;
    driver_allowance: number;
    maintenance_reserves: number;
  };
  cost_per_km: number;
  confidence_interval: {
    lower_bound: number;
    upper_bound: number;
  };
  model_version: string;
  evaluation_metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
  explainability: string[];
}

export interface IAIFleetInsights {
  operational: {
    fleet_utilization_percent: number;
    shipment_completion_percent: number;
    bottlenecks: string[];
    operating_health_index: string;
  };
  fuel: {
    analyzed_vehicles: number;
    fleet_total_odometer_km: number;
    estimated_average_efficiency_kmpl: number;
    anomalies: Array<{
      vehicle_id: string;
      registration_number: string;
      type: string;
      severity: string;
      message: string;
    }>;
    savings_potential_inr: number;
    summary: string;
  };
  maintenance: {
    monitored_vehicles: number;
    overdue_count: number;
    due_soon_count: number;
    alerts: Array<{
      vehicle_id: string;
      registration_number: string;
      status: string;
      km_since_last_service: number;
      recommended_action: string;
    }>;
  };
}

export interface IAIRecommendation {
  id: string;
  title: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  category: string;
  explanation: string;
  suggested_action: string;
  action_url?: string;
}

// ---------------------------------------------------------------------------
// Subscription & Billing Models
// ---------------------------------------------------------------------------
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface ISubscriptionPayment {
  _id?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  planCode: string;
  planName: string;
  paymentMethod: string;
  transactionReference: string;
  paidAt: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
}

export interface ISubscriptionPlan {
  _id: string;
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxVehicles: number;
  maxUsers: number;
  maxShipmentsPerMonth: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export interface ICompanySubscription {
  _id: string;
  companyId: string;
  planId: ISubscriptionPlan;
  planCode: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  trialEndsAt?: string;
  autoRenew: boolean;
  notes?: string;
  payments: ISubscriptionPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface ISubscriptionDetailsResponse {
  subscription: ICompanySubscription;
  plan: ISubscriptionPlan | null;
  usage: {
    vehiclesCount: number;
    usersCount: number;
    shipmentsCountThisMonth: number;
  };
  limits: {
    maxVehicles: number;
    maxUsers: number;
    maxShipmentsPerMonth: number;
  };
  daysRemaining: number;
  isExpired: boolean;
  isTrial: boolean;
}


