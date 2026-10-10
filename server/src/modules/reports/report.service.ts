import mongoose from 'mongoose';
import { Shipment } from '../../models/Shipment.js';
import { Trip } from '../../models/Trip.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { FuelLog } from '../../models/FuelLog.js';
import { Maintenance } from '../../models/Maintenance.js';
import { Expense } from '../../models/Expense.js';

export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  // CSV Formula Injection mitigation: escape leading '=', '+', '-', '@', '\t', '\r'
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class ReportService {
  static async getOperationalSummary(companyId: mongoose.Types.ObjectId) {
    const [
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      pendingShipments,
      totalTrips,
      completedTrips,
      inProgressTrips,
      shipmentFinancials,
      tripFinancials,
      totalVehicles,
      activeVehicles,
    ] = await Promise.all([
      Shipment.countDocuments({ companyId, isArchived: false }),
      Shipment.countDocuments({ companyId, status: 'DELIVERED', isArchived: false }),
      Shipment.countDocuments({ companyId, status: 'IN_TRANSIT', isArchived: false }),
      Shipment.countDocuments({ companyId, status: 'PENDING', isArchived: false }),
      Trip.countDocuments({ companyId, isArchived: false }),
      Trip.countDocuments({ companyId, status: 'COMPLETED', isArchived: false }),
      Trip.countDocuments({ companyId, status: 'IN_PROGRESS', isArchived: false }),
      Shipment.aggregate([
        { $match: { companyId, isArchived: false, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$agreedPrice' },
            estimatedCost: { $sum: '$estimatedCost' },
          },
        },
      ]),
      Trip.aggregate([
        { $match: { companyId, isArchived: false, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalEstimatedCost: { $sum: '$estimatedCost' },
            totalActualCost: { $sum: '$actualCost' },
            totalDistanceKm: { $sum: '$actualDistanceKm' },
          },
        },
      ]),
      Vehicle.countDocuments({ companyId, isArchived: false }),
      Vehicle.countDocuments({ companyId, status: 'ACTIVE', isArchived: false }),
    ]);

    const revenue = shipmentFinancials[0]?.totalRevenue || 0;
    const actualTripCost = tripFinancials[0]?.totalActualCost || 0;
    const estimatedTripCost = tripFinancials[0]?.totalEstimatedCost || 0;
    const grossMargin = revenue - actualTripCost;
    const marginPercent = revenue > 0 ? Number(((grossMargin / revenue) * 100).toFixed(1)) : 0;
    const fleetUtilization = totalVehicles > 0 ? Number(((activeVehicles / totalVehicles) * 100).toFixed(1)) : 0;

    return {
      shipments: {
        total: totalShipments,
        delivered: deliveredShipments,
        inTransit: inTransitShipments,
        pending: pendingShipments,
      },
      trips: {
        total: totalTrips,
        completed: completedTrips,
        inProgress: inProgressTrips,
        totalDistanceKm: tripFinancials[0]?.totalDistanceKm || 0,
      },
      financials: {
        totalRevenue: revenue,
        estimatedCost: estimatedTripCost,
        actualCost: actualTripCost,
        grossMargin,
        marginPercent,
      },
      fleet: {
        totalVehicles,
        activeVehicles,
        utilizationPercent: fleetUtilization,
      },
    };
  }

  static async exportShipmentsCsv(companyId: mongoose.Types.ObjectId): Promise<string> {
    const shipments = await Shipment.find({ companyId, isArchived: false })
      .populate('customerId', 'name')
      .populate('assignedVehicleId', 'registrationNumber')
      .populate('assignedDriverId', 'name')
      .populate('tripId', 'tripNumber')
      .sort({ createdAt: -1 });

    const headers = [
      'Shipment Reference',
      'Customer',
      'Origin City',
      'Destination City',
      'Cargo Description',
      'Category',
      'Weight (kg)',
      'Agreed Price',
      'Estimated Cost',
      'Status',
      'Vehicle',
      'Driver',
      'Trip Reference',
      'Created At',
      'Delivered At',
    ];

    const rows = shipments.map((s) => [
      sanitizeCsvCell(s.shipmentNumber),
      sanitizeCsvCell((s.customerId as any)?.name || 'N/A'),
      sanitizeCsvCell(s.origin?.city),
      sanitizeCsvCell(s.destination?.city),
      sanitizeCsvCell(s.cargoDescription),
      sanitizeCsvCell(s.cargoCategory),
      sanitizeCsvCell(s.weightKg),
      sanitizeCsvCell(s.agreedPrice),
      sanitizeCsvCell(s.estimatedCost),
      sanitizeCsvCell(s.status),
      sanitizeCsvCell((s.assignedVehicleId as any)?.registrationNumber || ''),
      sanitizeCsvCell((s.assignedDriverId as any)?.name || ''),
      sanitizeCsvCell((s.tripId as any)?.tripNumber || ''),
      sanitizeCsvCell(s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : ''),
      sanitizeCsvCell(s.deliveryConfirmation?.deliveredAt ? new Date(s.deliveryConfirmation.deliveredAt).toISOString().split('T')[0] : ''),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  static async exportTripsCsv(companyId: mongoose.Types.ObjectId): Promise<string> {
    const trips = await Trip.find({ companyId, isArchived: false })
      .populate('vehicleId', 'registrationNumber')
      .populate('driverId', 'name')
      .sort({ createdAt: -1 });

    const headers = [
      'Trip Reference',
      'Vehicle',
      'Driver',
      'Origin',
      'Destination',
      'Status',
      'Planned Departure',
      'Planned Arrival',
      'Estimated Distance (km)',
      'Actual Distance (km)',
      'Estimated Cost',
      'Actual Cost',
      'Fuel Cost',
      'Toll Cost',
      'Start Odometer',
      'End Odometer',
    ];

    const rows = trips.map((t) => [
      sanitizeCsvCell(t.tripNumber),
      sanitizeCsvCell((t.vehicleId as any)?.registrationNumber || 'N/A'),
      sanitizeCsvCell((t.driverId as any)?.name || 'N/A'),
      sanitizeCsvCell(t.originCity),
      sanitizeCsvCell(t.destinationCity),
      sanitizeCsvCell(t.status),
      sanitizeCsvCell(t.plannedDepartureDate ? new Date(t.plannedDepartureDate).toISOString().split('T')[0] : ''),
      sanitizeCsvCell(t.plannedArrivalDate ? new Date(t.plannedArrivalDate).toISOString().split('T')[0] : ''),
      sanitizeCsvCell(t.estimatedDistanceKm),
      sanitizeCsvCell(t.actualDistanceKm || ''),
      sanitizeCsvCell(t.estimatedCost),
      sanitizeCsvCell(t.actualCost || ''),
      sanitizeCsvCell(t.costBreakdown?.fuelCost || 0),
      sanitizeCsvCell(t.costBreakdown?.tollCost || 0),
      sanitizeCsvCell(t.startOdometer || ''),
      sanitizeCsvCell(t.endOdometer || ''),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}
