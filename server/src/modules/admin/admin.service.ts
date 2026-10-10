import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../models/User.js';
import { Company, ICompany } from '../../models/Company.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { Shipment } from '../../models/Shipment.js';
import { Trip } from '../../models/Trip.js';
import { Expense } from '../../models/Expense.js';
import { Plan, IPlan } from '../../models/Plan.js';
import { Subscription, ISubscription } from '../../models/Subscription.js';
import { AuditLog } from '../../models/AuditLog.js';
import { SupportTicket } from '../../models/SupportTicket.js';
import { Announcement } from '../../models/Announcement.js';
import { PlatformSetting } from '../../models/PlatformSetting.js';
import { AITelemetry } from '../../models/AITelemetry.js';
import { Invoice } from '../../models/Invoice.js';
import { ENV } from '../../config/env.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { checkDBHealth } from '../../config/db.js';
import { AiService } from '../ai/ai.service.js';
import { logger } from '../../utils/logger.js';

export class AdminService {
  /**
   * Seed standard subscription plans if not yet created in database
   */
  static async seedDefaultPlans(): Promise<void> {
    const defaultPlans = [
      {
        code: 'FREE',
        name: 'Free Starter Trial',
        description: 'For small transport operators testing digital fleet operations.',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'USD',
        maxVehicles: 3,
        maxUsers: 2,
        maxShipmentsPerMonth: 25,
        features: ['Real-time vehicle inventory', 'Basic trip scheduling', 'Standard fuel logging', 'Community support'],
        isPopular: false,
        isActive: true,
      },
      {
        code: 'STARTER',
        name: 'Growth Carrier',
        description: 'Designed for growing logistics fleets needing complete dispatch and cost tracking.',
        priceMonthly: 49,
        priceYearly: 490,
        currency: 'USD',
        maxVehicles: 15,
        maxUsers: 8,
        maxShipmentsPerMonth: 150,
        features: [
          'Up to 15 active vehicles',
          'Automated driver dispatch & conflict checking',
          'Maintenance schedules & alerts',
          'AI trip cost estimation',
          'Customer billing & invoice tracking',
          'Email support',
        ],
        isPopular: true,
        isActive: true,
      },
      {
        code: 'PROFESSIONAL',
        name: 'Enterprise Fleet',
        description: 'For multi-depot transport companies requiring high volume routing and advanced AI analytics.',
        priceMonthly: 149,
        priceYearly: 1490,
        currency: 'USD',
        maxVehicles: 60,
        maxUsers: 30,
        maxShipmentsPerMonth: 1000,
        features: [
          'Up to 60 active vehicles',
          'Multi-tenant branch management',
          'Dedicated AI cost regression model',
          'Predictive maintenance indicators',
          'Full operational CSV exports',
          'Priority phone & ticket support',
        ],
        isPopular: false,
        isActive: true,
      },
      {
        code: 'ENTERPRISE',
        name: 'Global Logistics Unlimited',
        description: 'Unlimited capacity, customized ERP integrations, and dedicated account manager.',
        priceMonthly: 399,
        priceYearly: 3990,
        currency: 'USD',
        maxVehicles: 500,
        maxUsers: 150,
        maxShipmentsPerMonth: 10000,
        features: [
          'Unlimited fleet & user capacity',
          'Custom telemetry API access',
          'Automated SLA monitoring',
          'Dedicated 24/7 account management',
          'Custom ML training pipeline',
        ],
        isPopular: false,
        isActive: true,
      },
    ];

    for (const planData of defaultPlans) {
      await Plan.findOneAndUpdate({ code: planData.code }, { $setOnInsert: planData }, { upsert: true, new: true });
    }
  }

  /**
   * Secure Super Admin Provisioning / Bootstrap
   */
  static async bootstrapSuperAdmin(input: {
    email: string;
    password: string;
    name: string;
    setupSecret?: string;
  }): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    await this.seedDefaultPlans();

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

    // If a super admin already exists, verify setup secret for emergency re-provisioning
    if (existingSuperAdmin) {
      const configuredSecret = ENV.ADMIN_SETUP_SECRET;
      if (!input.setupSecret || input.setupSecret !== configuredSecret) {
        throw new Error('A Super Admin account already exists. Please sign in with your credentials.');
      }
    }

    const salt = await bcrypt.genSalt(ENV.BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, salt);

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.role = 'SUPER_ADMIN';
      user.name = input.name.trim();
      user.passwordHash = passwordHash;
      user.status = 'ACTIVE';
      user.companyId = null;
      await user.save();
    } else {
      user = new User({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        companyId: null,
        status: 'ACTIVE',
      });
      await user.save();
    }

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: 'SUPER_ADMIN',
      action: 'SUPER_ADMIN_BOOTSTRAP',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { email: user.email, note: 'Super Admin initialized via bootstrap' },
    });

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: 'SUPER_ADMIN',
      companyId: null,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Platform Overview: Comprehensive database-backed metrics across all tenants
   */
  static async getOverview(): Promise<Record<string, any>> {
    await this.seedDefaultPlans();

    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      totalUsers,
      activeUsers,
      totalVehicles,
      totalDrivers,
      totalShipments,
      totalTrips,
      completedTrips,
      totalExpensesRes,
      invoicesRes,
      recentAuditLogs,
      planDistributionRes,
      aiTelemetryRes,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'ACTIVE' }),
      Company.countDocuments({ status: 'TRIAL' }),
      Company.countDocuments({ status: 'SUSPENDED' }),
      User.countDocuments(),
      User.countDocuments({ status: 'ACTIVE' }),
      Vehicle.countDocuments({ isArchived: false }),
      Driver.countDocuments({ isArchived: false }),
      Shipment.countDocuments(),
      Trip.countDocuments(),
      Trip.countDocuments({ status: 'COMPLETED' }),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$totalAmount' },
            totalCollected: { $sum: '$paidAmount' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(8),
      Subscription.aggregate([
        { $group: { _id: '$planCode', count: { $sum: 1 } } },
      ]),
      AITelemetry.aggregate([
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            fallbackCount: { $sum: { $cond: ['$usedFallback', 1, 0] } },
            successCount: { $sum: { $cond: ['$success', 1, 0] } },
            avgDuration: { $avg: '$durationMs' },
          },
        },
      ]),
    ]);

    const totalExpenseAmount = totalExpensesRes[0]?.total || 0;
    const totalBilled = invoicesRes[0]?.totalBilled || 0;
    const totalCollected = invoicesRes[0]?.totalCollected || 0;
    const invoiceCount = invoicesRes[0]?.invoiceCount || 0;

    const aiMetrics = aiTelemetryRes[0] || {
      totalRequests: 0,
      fallbackCount: 0,
      successCount: 0,
      avgDuration: 0,
    };

    const dbHealth = checkDBHealth();

    return {
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        trial: trialCompanies,
        suspended: suspendedCompanies,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      fleet: {
        vehicles: totalVehicles,
        drivers: totalDrivers,
      },
      operations: {
        shipments: totalShipments,
        trips: totalTrips,
        completedTrips,
      },
      finance: {
        totalBilled,
        totalCollected,
        totalExpenses: totalExpenseAmount,
        invoiceCount,
        operatingMargin: totalBilled > 0 ? totalBilled - totalExpenseAmount : 0,
      },
      subscriptions: {
        planDistribution: planDistributionRes.map((p) => ({ plan: p._id || 'STARTER', count: p.count })),
      },
      aiMonitoring: {
        totalRequests: aiMetrics.totalRequests,
        fallbackCount: aiMetrics.fallbackCount,
        successCount: aiMetrics.successCount,
        avgLatencyMs: Math.round(aiMetrics.avgDuration || 0),
        successRate: aiMetrics.totalRequests > 0
          ? Math.round((aiMetrics.successCount / aiMetrics.totalRequests) * 100)
          : 100,
      },
      systemHealth: {
        databaseConnected: dbHealth.isConnected,
        storageType: dbHealth.storageType,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      },
      recentActivity: recentAuditLogs,
    };
  }

  /**
   * Company Management: Search, paginate, filter companies across platform
   */
  static async getCompanies(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status && ['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(query.status)) {
      filter.status = query.status;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { email: searchRegex },
      ];
    }

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('ownerId', 'name email phone status lastLoginAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(filter),
    ]);

    // Enhance companies with counts of vehicles, drivers, shipments, and subscription
    const enhancedCompanies = await Promise.all(
      companies.map(async (comp) => {
        const [vehicleCount, driverCount, userCount, shipmentCount, sub] = await Promise.all([
          Vehicle.countDocuments({ companyId: comp._id, isArchived: false }),
          Driver.countDocuments({ companyId: comp._id, isArchived: false }),
          User.countDocuments({ companyId: comp._id }),
          Shipment.countDocuments({ companyId: comp._id }),
          Subscription.findOne({ companyId: comp._id }).populate('planId', 'name code').lean(),
        ]);

        return {
          ...comp,
          metrics: {
            vehicles: vehicleCount,
            drivers: driverCount,
            users: userCount,
            shipments: shipmentCount,
          },
          subscription: sub || {
            planCode: 'STARTER',
            status: comp.status === 'SUSPENDED' ? 'SUSPENDED' : 'TRIAL',
          },
        };
      })
    );

    return {
      companies: enhancedCompanies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single company details with operational and audit breakdown
   */
  static async getCompanyDetails(companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      throw new Error('Invalid company ID format.');
    }

    const company = await Company.findById(companyId)
      .populate('ownerId', 'name email phone status createdAt lastLoginAt')
      .lean();

    if (!company) {
      throw new Error('Company not found.');
    }

    const [
      users,
      vehicles,
      drivers,
      shipmentCount,
      tripCount,
      subscription,
      auditHistory,
    ] = await Promise.all([
      User.find({ companyId }).select('name email role status lastLoginAt createdAt').lean(),
      Vehicle.find({ companyId, isArchived: false }).select('registrationNumber type status mileageKm fuelType').lean(),
      Driver.find({ companyId, isArchived: false }).select('name phone licenseNumber status').lean(),
      Shipment.countDocuments({ companyId }),
      Trip.countDocuments({ companyId }),
      Subscription.findOne({ companyId }).populate('planId').lean(),
      AuditLog.find({ targetId: companyId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return {
      company,
      metrics: {
        userCount: users.length,
        vehicleCount: vehicles.length,
        driverCount: drivers.length,
        shipmentCount,
        tripCount,
      },
      users,
      vehicles,
      drivers,
      subscription: subscription || {
        planCode: 'STARTER',
        status: company.status,
      },
      auditHistory,
    };
  }

  /**
   * Suspend or Reactivate a Company
   */
  static async updateCompanyStatus(
    companyId: string,
    status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED',
    reason?: string,
    actor?: IUser
  ) {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      throw new Error('Invalid company ID format.');
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found.');
    }

    const oldStatus = company.status;
    company.status = status;
    await company.save();

    // Also update associated subscription status if one exists
    await Subscription.findOneAndUpdate(
      { companyId: company._id },
      { $set: { status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE' } }
    );

    // Record administrative audit log
    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: status === 'SUSPENDED' ? 'COMPANY_SUSPENDED' : 'COMPANY_ACTIVATED',
      targetType: 'Company',
      targetId: company._id.toString(),
      details: {
        companyName: company.name,
        previousStatus: oldStatus,
        newStatus: status,
        reason: reason || 'Administrative status adjustment',
      },
    });

    logger.info(`[AdminService] Company "${company.name}" (${company._id}) status changed: ${oldStatus} -> ${status}`);

    return company;
  }

  /**
   * Platform User Management: Search, paginate, filter users across platform
   */
  static async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status && ['ACTIVE', 'INACTIVE'].includes(query.status)) {
      filter.status = query.status;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('companyId', 'name slug status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash')
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Toggle user active/inactive status across platform
   */
  static async updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE', reason?: string, actor?: IUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format.');
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new Error('User not found.');
    }

    // Safety: prevent deactivating oneself if the only Super Admin
    if (targetUser.role === 'SUPER_ADMIN' && status === 'INACTIVE') {
      const activeAdmins = await User.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' });
      if (activeAdmins <= 1) {
        throw new Error('Cannot deactivate the sole active Super Admin account.');
      }
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'USER_STATUS_UPDATE',
      targetType: 'User',
      targetId: targetUser._id.toString(),
      details: {
        userName: targetUser.name,
        userEmail: targetUser.email,
        previousStatus,
        newStatus: status,
        reason: reason || 'Administrative action',
      },
    });

    return targetUser;
  }

  /**
   * Subscription Plans CRUD
   */
  static async getPlans(): Promise<IPlan[]> {
    await this.seedDefaultPlans();
    return Plan.find().sort({ priceMonthly: 1 });
  }

  static async createPlan(input: any, actor?: IUser): Promise<IPlan> {
    const existing = await Plan.findOne({ code: input.code.toUpperCase().trim() });
    if (existing) {
      throw new Error(`Plan with code "${input.code}" already exists.`);
    }

    const plan = new Plan({
      ...input,
      code: input.code.toUpperCase().trim(),
    });
    await plan.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'PLAN_CREATED',
      targetType: 'Plan',
      targetId: plan._id.toString(),
      details: { planCode: plan.code, planName: plan.name },
    });

    return plan;
  }

  static async updatePlan(planId: string, input: any, actor?: IUser): Promise<IPlan> {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      throw new Error('Invalid plan ID format.');
    }

    const plan = await Plan.findByIdAndUpdate(planId, { $set: input }, { new: true });
    if (!plan) {
      throw new Error('Plan not found.');
    }

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'PLAN_UPDATED',
      targetType: 'Plan',
      targetId: plan._id.toString(),
      details: { planCode: plan.code, updates: input },
    });

    return plan;
  }

  /**
   * Subscriptions list & management
   */
  static async getSubscriptions(query: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('companyId', 'name slug email status')
        .populate('planId', 'name code maxVehicles maxUsers priceMonthly')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async updateSubscription(subId: string, input: any, actor?: IUser): Promise<ISubscription> {
    if (!mongoose.Types.ObjectId.isValid(subId)) {
      throw new Error('Invalid subscription ID format.');
    }

    const sub = await Subscription.findById(subId);
    if (!sub) {
      throw new Error('Subscription not found.');
    }

    if (input.planId) {
      const plan = await Plan.findById(input.planId);
      if (plan) {
        sub.planId = plan._id as any;
        sub.planCode = plan.code;
      }
    }

    if (input.status) sub.status = input.status;
    if (input.billingCycle) sub.billingCycle = input.billingCycle;
    if (input.endDate) sub.endDate = new Date(input.endDate);
    if (input.notes) sub.notes = input.notes;

    await sub.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'SUBSCRIPTION_UPDATED',
      targetType: 'Subscription',
      targetId: sub._id.toString(),
      details: { companyId: sub.companyId, status: sub.status, planCode: sub.planCode },
    });

    return sub;
  }

  /**
   * Platform Analytics: Aggregated trend data over time
   */
  static async getAnalytics() {
    const [
      companyGrowth,
      tripStats,
      shipmentStats,
      planDistribution,
    ] = await Promise.all([
      Company.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Trip.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDistance: { $sum: '$actualDistanceKm' },
            totalCost: { $sum: '$actualCost' },
          },
        },
      ]),
      Shipment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalWeight: { $sum: '$cargoWeightKg' },
          },
        },
      ]),
      Subscription.aggregate([
        { $group: { _id: '$planCode', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      companyGrowth: companyGrowth.map((item) => ({ month: item._id, count: item.count })),
      tripStats,
      shipmentStats,
      planDistribution: planDistribution.map((item) => ({ plan: item._id || 'STARTER', count: item.count })),
    };
  }

  /**
   * AI/ML Monitoring: Telemetry stats and recent inference logs
   */
  static async getAiMonitoring() {
    const [summary, recentLogs, aiHealth] = await Promise.all([
      AITelemetry.aggregate([
        {
          $group: {
            _id: '$endpoint',
            totalCalls: { $sum: 1 },
            fallbacks: { $sum: { $cond: ['$usedFallback', 1, 0] } },
            errors: { $sum: { $cond: ['$success', 0, 1] } },
            avgDurationMs: { $avg: '$durationMs' },
          },
        },
      ]),
      AITelemetry.find().sort({ createdAt: -1 }).limit(15).lean(),
      AiService.checkAiHealth(),
    ]);

    return {
      aiHealth,
      endpointsSummary: summary,
      recentLogs,
    };
  }

  /**
   * Support Tickets Management
   */
  static async getSupportTickets(query: { page?: number; limit?: number; status?: string; priority?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('companyId', 'name email')
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async updateSupportTicket(ticketId: string, input: any, actor?: IUser) {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new Error('Invalid ticket ID format.');
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found.');

    if (input.status) ticket.status = input.status;
    if (input.priority) ticket.priority = input.priority;

    await ticket.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'SUPPORT_TICKET_UPDATED',
      targetType: 'SupportTicket',
      targetId: ticket._id.toString(),
      details: { ticketNumber: ticket.ticketNumber, status: ticket.status },
    });

    return ticket;
  }

  static async addTicketReply(ticketId: string, message: string, actor: IUser) {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new Error('Invalid ticket ID format.');
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found.');

    ticket.messages.push({
      senderId: actor._id as any,
      senderName: actor.name,
      senderRole: actor.role,
      message,
      createdAt: new Date(),
    });

    if (actor.role === 'SUPER_ADMIN' && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();
    return ticket;
  }

  /**
   * Announcements Management
   */
  static async getAnnouncements() {
    return Announcement.find().sort({ createdAt: -1 }).lean();
  }

  static async createAnnouncement(input: any, actor?: IUser) {
    const ann = new Announcement({
      ...input,
      createdBy: actor?._id,
    });
    await ann.save();

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_CREATED',
      targetType: 'Announcement',
      targetId: ann._id.toString(),
      details: { title: ann.title, priority: ann.priority },
    });

    return ann;
  }

  static async updateAnnouncement(id: string, input: any, actor?: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid announcement ID format.');

    const ann = await Announcement.findByIdAndUpdate(id, { $set: input }, { new: true });
    if (!ann) throw new Error('Announcement not found.');

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_UPDATED',
      targetType: 'Announcement',
      targetId: ann._id.toString(),
      details: { title: ann.title },
    });

    return ann;
  }

  static async deleteAnnouncement(id: string, actor?: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid announcement ID format.');
    const ann = await Announcement.findByIdAndDelete(id);
    if (!ann) throw new Error('Announcement not found.');

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_DELETED',
      targetType: 'Announcement',
      targetId: id,
      details: { title: ann.title },
    });

    return { deleted: true };
  }

  /**
   * Audit Logs query
   */
  static async getAuditLogs(query: { page?: number; limit?: number; action?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.action) filter.action = query.action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Comprehensive System Health Check
   */
  static async getSystemHealth() {
    const dbHealth = checkDBHealth();
    let aiHealthStatus: any = null;
    try {
      aiHealthStatus = await AiService.checkAiHealth();
    } catch {
      aiHealthStatus = { aiServiceOnline: false, status: 'unreachable' };
    }

    return {
      server: {
        status: 'UP',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: {
          rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
        },
      },
      database: {
        connected: dbHealth.isConnected,
        status: dbHealth.state,
        storageType: dbHealth.storageType,
        isPersistent: dbHealth.isPersistent,
      },
      aiService: aiHealthStatus,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Platform Settings
   */
  static async getSettings(): Promise<Record<string, any>> {
    const settings = await PlatformSetting.find().lean();
    const result: Record<string, any> = {
      maintenanceMode: false,
      allowSelfRegistration: true,
      defaultTrialDays: 14,
      supportEmail: 'support@fleetflow.io',
      enforcePlanLimits: true,
    };

    for (const s of settings) {
      result[s.key] = s.value;
    }

    return result;
  }

  static async updateSettings(newSettings: Record<string, any>, actor?: IUser) {
    for (const [key, value] of Object.entries(newSettings)) {
      await PlatformSetting.findOneAndUpdate(
        { key },
        { $set: { key, value, updatedBy: actor?._id, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'superadmin@fleetflow.io',
      actorRole: 'SUPER_ADMIN',
      action: 'PLATFORM_SETTINGS_UPDATED',
      targetType: 'PlatformSetting',
      details: { keysUpdated: Object.keys(newSettings) },
    });

    return this.getSettings();
  }
}
