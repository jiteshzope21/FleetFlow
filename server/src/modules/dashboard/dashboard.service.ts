import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { Company } from '../../models/Company.js';

export class DashboardService {
  static async getOverview(companyId: mongoose.Types.ObjectId) {
    const [company, totalUsers, activeUsers, roleCounts] = await Promise.all([
      Company.findById(companyId),
      User.countDocuments({ companyId }),
      User.countDocuments({ companyId, status: 'ACTIVE' }),
      User.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const rolesMap: Record<string, number> = {};
    roleCounts.forEach((r) => {
      rolesMap[r._id] = r.count;
    });

    return {
      company: {
        id: company?._id,
        name: company?.name,
        slug: company?.slug,
        status: company?.status,
        createdAt: company?.createdAt,
      },
      team: {
        totalMembers: totalUsers,
        activeMembers: activeUsers,
        rolesBreakdown: rolesMap,
      },
      fleet: {
        totalVehicles: 0,
        activeVehicles: 0,
        status: 'Available in Phase 2',
      },
      trips: {
        totalTrips: 0,
        ongoingTrips: 0,
        completedTrips: 0,
        status: 'Available in Phase 3',
      },
      drivers: {
        totalDrivers: rolesMap['DRIVER'] || 0,
        availableDrivers: rolesMap['DRIVER'] || 0,
        status: rolesMap['DRIVER'] ? 'Drivers onboarded in team' : 'Available in Phase 2',
      },
      maintenance: {
        pendingAlerts: 0,
        status: 'Available in Phase 2',
      },
      financials: {
        monthlyRevenue: 0,
        monthlyFuelExpense: 0,
        netProfit: 0,
        status: 'Available in Phase 3',
      },
    };
  }

  static async getActivity(companyId: mongoose.Types.ObjectId) {
    // Phase 1 real activity: recent team members registered
    const recentUsers = await User.find({ companyId })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = recentUsers.map((u) => ({
      id: u._id.toString(),
      type: 'USER_JOINED',
      title: `${u.name} joined as ${u.role}`,
      timestamp: u.createdAt,
      actor: u.name,
    }));

    return activities;
  }
}
