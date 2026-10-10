import { api } from '../lib/api.js';

export interface AdminOverviewData {
  companies: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
  users: {
    total: number;
    active: number;
  };
  fleet: {
    vehicles: number;
    drivers: number;
  };
  operations: {
    shipments: number;
    trips: number;
    completedTrips: number;
  };
  finance: {
    totalBilled: number;
    totalCollected: number;
    totalExpenses: number;
    invoiceCount: number;
    operatingMargin: number;
  };
  subscriptions: {
    planDistribution: Array<{ plan: string; count: number }>;
  };
  aiMonitoring: {
    totalRequests: number;
    fallbackCount: number;
    successCount: number;
    avgLatencyMs: number;
    successRate: number;
  };
  systemHealth: {
    databaseConnected: boolean;
    storageType: string;
    uptimeSeconds: number;
    memoryUsageMb: number;
  };
  recentActivity: Array<{
    _id: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    targetType: string;
    details?: any;
    createdAt: string;
  }>;
}

export interface AdminCompany {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  businessType: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  ownerId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    lastLoginAt?: string;
  };
  metrics: {
    vehicles: number;
    drivers: number;
    users: number;
    shipments: number;
  };
  subscription?: {
    planCode: string;
    status: string;
  };
  createdAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  companyId?: {
    _id: string;
    name: string;
    slug: string;
    status: string;
  };
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminPlan {
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

export interface AdminSubscription {
  _id: string;
  companyId: {
    _id: string;
    name: string;
    email: string;
    status: string;
  };
  planId: {
    _id: string;
    name: string;
    code: string;
    priceMonthly: number;
    maxVehicles: number;
    maxUsers: number;
  };
  planCode: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface AdminSupportTicket {
  _id: string;
  ticketNumber: string;
  companyId?: {
    _id: string;
    name: string;
    email: string;
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  messages: Array<{
    _id: string;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnnouncement {
  _id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  targetAudience: 'ALL' | 'OWNERS' | 'DISPATCHERS';
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export const adminService = {
  // Overview
  getOverview: async () => {
    const res = await api.get('/admin/overview');
    return res.data?.data as AdminOverviewData;
  },

  // Companies
  getCompanies: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const res = await api.get('/admin/companies', { params });
    return res.data?.data as {
      companies: AdminCompany[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  getCompanyDetails: async (id: string) => {
    const res = await api.get(`/admin/companies/${id}`);
    return res.data?.data;
  },

  updateCompanyStatus: async (id: string, status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED', reason?: string) => {
    const res = await api.patch(`/admin/companies/${id}/status`, { status, reason });
    return res.data?.data;
  },

  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const res = await api.get('/admin/users', { params });
    return res.data?.data as {
      users: AdminUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  updateUserStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE', reason?: string) => {
    const res = await api.patch(`/admin/users/${id}/status`, { status, reason });
    return res.data?.data;
  },

  // Plans
  getPlans: async () => {
    const res = await api.get('/admin/plans');
    return res.data?.data as AdminPlan[];
  },

  createPlan: async (data: Partial<AdminPlan>) => {
    const res = await api.post('/admin/plans', data);
    return res.data?.data as AdminPlan;
  },

  updatePlan: async (id: string, data: Partial<AdminPlan>) => {
    const res = await api.put(`/admin/plans/${id}`, data);
    return res.data?.data as AdminPlan;
  },

  // Subscriptions
  getSubscriptions: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await api.get('/admin/subscriptions', { params });
    return res.data?.data as {
      subscriptions: AdminSubscription[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  updateSubscription: async (id: string, data: any) => {
    const res = await api.patch(`/admin/subscriptions/${id}`, data);
    return res.data?.data;
  },

  // Analytics
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data?.data;
  },

  // AI Monitoring
  getAiMonitoring: async () => {
    const res = await api.get('/admin/ai-monitoring');
    return res.data?.data;
  },

  // Support Tickets
  getSupportTickets: async (params?: { page?: number; limit?: number; status?: string; priority?: string }) => {
    const res = await api.get('/admin/support', { params });
    return res.data?.data as {
      tickets: AdminSupportTicket[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  updateSupportTicket: async (id: string, data: { status?: string; priority?: string }) => {
    const res = await api.patch(`/admin/support/${id}`, data);
    return res.data?.data;
  },

  addTicketReply: async (id: string, message: string) => {
    const res = await api.post(`/admin/support/${id}/reply`, { message });
    return res.data?.data;
  },

  // Announcements
  getAnnouncements: async () => {
    const res = await api.get('/admin/announcements');
    return res.data?.data as AdminAnnouncement[];
  },

  createAnnouncement: async (data: Partial<AdminAnnouncement>) => {
    const res = await api.post('/admin/announcements', data);
    return res.data?.data as AdminAnnouncement;
  },

  updateAnnouncement: async (id: string, data: Partial<AdminAnnouncement>) => {
    const res = await api.patch(`/admin/announcements/${id}`, data);
    return res.data?.data as AdminAnnouncement;
  },

  deleteAnnouncement: async (id: string) => {
    const res = await api.delete(`/admin/announcements/${id}`);
    return res.data?.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { page?: number; limit?: number; action?: string }) => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data?.data;
  },

  // System Health
  getSystemHealth: async () => {
    const res = await api.get('/admin/health');
    return res.data?.data;
  },

  // Platform Settings
  getSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data?.data;
  },

  updateSettings: async (settings: Record<string, any>) => {
    const res = await api.patch('/admin/settings', { settings });
    return res.data?.data;
  },

  // Bootstrap
  bootstrapAdmin: async (data: any) => {
    const res = await api.post('/admin/bootstrap', data);
    return res.data?.data;
  },
};
