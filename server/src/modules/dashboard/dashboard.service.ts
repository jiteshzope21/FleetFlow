import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { Company } from '../../models/Company.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { Customer } from '../../models/Customer.js';
import { Maintenance } from '../../models/Maintenance.js';
import { FuelLog } from '../../models/FuelLog.js';
import { Expense } from '../../models/Expense.js';
import { Shipment } from '../../models/Shipment.js';
import { Trip } from '../../models/Trip.js';

export class DashboardService {
  static async getOverview(companyId: mongoose.Types.ObjectId) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      company,
      totalUsers,
      activeUsers,
      roleCounts,
      totalVehicles,
      activeVehicles,
      inMaintenanceVehicles,
      totalDrivers,
      activeDrivers,
      totalCustomers,
      activeCustomers,
      scheduledMaintenance,
      inProgressMaintenance,
      maintenanceCostAgg,
      fuelCostAgg,
      generalExpenseAgg,
      expiringVehiclesCount,
      expiringDriversCount,
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      pendingShipments,
      totalTrips,
      inProgressTrips,
      completedTrips,
    ] = await Promise.all([
      Company.findById(companyId),
      User.countDocuments({ companyId }),
      User.countDocuments({ companyId, status: 'ACTIVE' }),
      User.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Vehicle.countDocuments({ companyId, isArchived: false }),
      Vehicle.countDocuments({ companyId, isArchived: false, status: 'ACTIVE' }),
      Vehicle.countDocuments({ companyId, isArchived: false, status: 'IN_MAINTENANCE' }),
      Driver.countDocuments({ companyId, isArchived: false }),
      Driver.countDocuments({ companyId, isArchived: false, status: 'ACTIVE' }),
      Customer.countDocuments({ companyId, isArchived: false }),
      Customer.countDocuments({ companyId, isArchived: false, status: 'ACTIVE' }),
      Maintenance.countDocuments({ companyId, isArchived: false, status: 'SCHEDULED' }),
      Maintenance.countDocuments({ companyId, isArchived: false, status: 'IN_PROGRESS' }),
      Maintenance.aggregate([
        { $match: { companyId, isArchived: false, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
      FuelLog.aggregate([
        { $match: { companyId, isArchived: false } },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$totalCost' },
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { companyId, isArchived: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Vehicle.countDocuments({
        companyId,
        isArchived: false,
        $or: [
          { insuranceExpiryDate: { $lte: thirtyDaysFromNow } },
          { registrationExpiryDate: { $lte: thirtyDaysFromNow } },
          { pollutionExpiryDate: { $lte: thirtyDaysFromNow } },
        ],
      }),
      Driver.countDocuments({
        companyId,
        isArchived: false,
        licenseExpiryDate: { $lte: thirtyDaysFromNow },
      }),
      Shipment.countDocuments({ companyId, isArchived: false }),
      Shipment.countDocuments({ companyId, isArchived: false, status: 'DELIVERED' }),
      Shipment.countDocuments({ companyId, isArchived: false, status: 'IN_TRANSIT' }),
      Shipment.countDocuments({ companyId, isArchived: false, status: 'PENDING' }),
      Trip.countDocuments({ companyId, isArchived: false }),
      Trip.countDocuments({ companyId, isArchived: false, status: 'IN_PROGRESS' }),
      Trip.countDocuments({ companyId, isArchived: false, status: 'COMPLETED' }),
    ]);

    const rolesMap: Record<string, number> = {};
    roleCounts.forEach((r) => {
      rolesMap[r._id] = r.count;
    });

    const maintenanceExpenditure = maintenanceCostAgg[0]?.total || 0;
    const fuelExpenditure = fuelCostAgg[0]?.totalCost || 0;
    const totalFuelQuantity = fuelCostAgg[0]?.totalQuantity || 0;
    const generalOperatingExpense = generalExpenseAgg[0]?.total || 0;

    // Total Operating Expenses = General Operating Expenses + Fuel + Maintenance
    const totalOperatingCost = generalOperatingExpense + fuelExpenditure + maintenanceExpenditure;

    return {
      company: {
        id: company?._id,
        name: company?.name,
        slug: company?.slug,
        status: company?.status,
        currency: company?.settings?.currency || 'INR',
        distanceUnit: company?.settings?.distanceUnit || 'km',
        createdAt: company?.createdAt,
      },
      team: {
        totalMembers: totalUsers,
        activeMembers: activeUsers,
        rolesBreakdown: rolesMap,
      },
      fleet: {
        totalVehicles,
        activeVehicles,
        inMaintenanceVehicles,
        inactiveVehicles: totalVehicles - (activeVehicles + inMaintenanceVehicles),
      },
      drivers: {
        totalDrivers,
        activeDrivers,
        availableDrivers: activeDrivers,
      },
      customers: {
        totalCustomers,
        activeCustomers,
      },
      maintenance: {
        scheduled: scheduledMaintenance,
        inProgress: inProgressMaintenance,
        totalAlerts: scheduledMaintenance + inProgressMaintenance,
        expenditure: maintenanceExpenditure,
      },
      fuel: {
        totalCost: fuelExpenditure,
        totalQuantity: totalFuelQuantity,
      },
      expenses: {
        generalExpense: generalOperatingExpense,
        fuelExpense: fuelExpenditure,
        maintenanceExpense: maintenanceExpenditure,
        totalOperatingCost,
      },
      alerts: {
        expiringVehicleDocs: expiringVehiclesCount,
        expiringDriverLicenses: expiringDriversCount,
        totalAlerts: expiringVehiclesCount + expiringDriversCount + scheduledMaintenance,
      },
      trips: {
        totalTrips,
        ongoingTrips: inProgressTrips,
        completedTrips,
        status: 'Operational',
      },
      shipments: {
        totalShipments,
        deliveredShipments,
        inTransitShipments,
        pendingShipments,
      },
    };
  }

  static async getActivity(companyId: mongoose.Types.ObjectId) {
    // Collect recent operational events across collections
    const [recentUsers, recentVehicles, recentMaintenance, recentFuel, recentExpenses, recentTrips, recentShipments] = await Promise.all([
      User.find({ companyId }).select('name role createdAt').sort({ createdAt: -1 }).limit(3),
      Vehicle.find({ companyId, isArchived: false }).select('registrationNumber make model createdAt').sort({ createdAt: -1 }).limit(3),
      Maintenance.find({ companyId, isArchived: false }).populate('vehicleId', 'registrationNumber').select('serviceType description status createdAt').sort({ createdAt: -1 }).limit(3),
      FuelLog.find({ companyId, isArchived: false }).populate('vehicleId', 'registrationNumber').select('quantity totalCost createdAt').sort({ createdAt: -1 }).limit(3),
      Expense.find({ companyId, isArchived: false }).select('title amount category createdAt').sort({ createdAt: -1 }).limit(3),
      Trip.find({ companyId, isArchived: false }).select('tripNumber status originCity destinationCity createdAt').sort({ createdAt: -1 }).limit(3),
      Shipment.find({ companyId, isArchived: false }).select('shipmentNumber status cargoDescription createdAt').sort({ createdAt: -1 }).limit(3),
    ]);

    const activities: Array<{ id: string; type: string; title: string; timestamp: Date; actor: string }> = [];

    recentTrips.forEach((t) => {
      activities.push({
        id: `trip-${t._id}`,
        type: 'TRIP_DISPATCHED',
        title: `Trip ${t.tripNumber}: ${t.originCity} -> ${t.destinationCity} (${t.status})`,
        timestamp: t.createdAt,
        actor: 'Dispatcher',
      });
    });

    recentShipments.forEach((s) => {
      activities.push({
        id: `shipment-${s._id}`,
        type: 'SHIPMENT_CREATED',
        title: `Shipment ${s.shipmentNumber}: ${s.cargoDescription} (${s.status})`,
        timestamp: s.createdAt,
        actor: 'Transport Ops',
      });
    });

    recentUsers.forEach((u) => {
      activities.push({
        id: `user-${u._id}`,
        type: 'USER_JOINED',
        title: `${u.name} joined as ${u.role}`,
        timestamp: u.createdAt,
        actor: u.name,
      });
    });

    recentVehicles.forEach((v) => {
      activities.push({
        id: `vehicle-${v._id}`,
        type: 'VEHICLE_ADDED',
        title: `Vehicle added: ${v.registrationNumber} (${v.make} ${v.model})`,
        timestamp: v.createdAt,
        actor: 'Fleet Manager',
      });
    });

    recentMaintenance.forEach((m: any) => {
      const reg = m.vehicleId?.registrationNumber || 'Vehicle';
      activities.push({
        id: `maint-${m._id}`,
        type: 'MAINTENANCE_EVENT',
        title: `Maintenance [${m.status}]: ${reg} - ${m.serviceType.replace('_', ' ')}`,
        timestamp: m.createdAt,
        actor: 'Maintenance Workshop',
      });
    });

    recentFuel.forEach((f: any) => {
      const reg = f.vehicleId?.registrationNumber || 'Vehicle';
      activities.push({
        id: `fuel-${f._id}`,
        type: 'FUEL_LOGGED',
        title: `Fuel Refill: ${reg} - ${f.quantity}L (₹${f.totalCost})`,
        timestamp: f.createdAt,
        actor: 'Fuel Station',
      });
    });

    recentExpenses.forEach((e) => {
      activities.push({
        id: `exp-${e._id}`,
        type: 'EXPENSE_LOGGED',
        title: `Expense: ${e.title} - ₹${e.amount} (${e.category})`,
        timestamp: e.createdAt,
        actor: 'Accounts',
      });
    });

    // Sort by timestamp descending and take top 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 10);
  }
}
