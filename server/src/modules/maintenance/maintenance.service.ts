import mongoose from 'mongoose';
import { Maintenance, IMaintenance } from '../../models/Maintenance.js';
import { Vehicle } from '../../models/Vehicle.js';
import { CreateMaintenanceInput, UpdateMaintenanceInput, MaintenanceQueryInput } from './maintenance.validator.js';

export class MaintenanceService {
  static async getMaintenanceList(companyId: mongoose.Types.ObjectId, query: MaintenanceQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      companyId,
      isArchived: false,
    };

    if (query.vehicleId && mongoose.Types.ObjectId.isValid(query.vehicleId)) {
      filter.vehicleId = new mongoose.Types.ObjectId(query.vehicleId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.serviceType) {
      filter.serviceType = query.serviceType;
    }

    const [records, total, totalCostResult] = await Promise.all([
      Maintenance.find(filter)
        .populate('vehicleId', 'registrationNumber make model status currentOdometer')
        .sort({ serviceDate: -1 })
        .skip(skip)
        .limit(limit),
      Maintenance.countDocuments(filter),
      Maintenance.aggregate([
        { $match: { ...filter, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
    ]);

    const totalMaintenanceExpenditure = totalCostResult[0]?.total || 0;

    return {
      records,
      totalMaintenanceExpenditure,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getMaintenanceById(companyId: mongoose.Types.ObjectId, id: string): Promise<IMaintenance> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance record ID format.');
    }

    const record = await Maintenance.findOne({
      _id: id,
      companyId,
      isArchived: false,
    }).populate('vehicleId', 'registrationNumber make model status currentOdometer');

    if (!record) {
      throw new Error('Maintenance record not found.');
    }

    return record;
  }

  static async createMaintenance(
    companyId: mongoose.Types.ObjectId,
    input: CreateMaintenanceInput
  ): Promise<IMaintenance> {
    if (!mongoose.Types.ObjectId.isValid(input.vehicleId)) {
      throw new Error('Invalid vehicle ID format.');
    }

    const vehicle = await Vehicle.findOne({
      _id: input.vehicleId,
      companyId,
      isArchived: false,
    });

    if (!vehicle) {
      throw new Error('Referenced vehicle not found in your fleet.');
    }

    const partsCost = Number(input.partsCost) || 0;
    const laborCost = Number(input.laborCost) || 0;
    const totalCost = input.totalCost !== undefined && input.totalCost !== null
      ? Number(input.totalCost)
      : partsCost + laborCost;

    const maintenance = new Maintenance({
      companyId,
      vehicleId: vehicle._id,
      serviceType: input.serviceType,
      description: input.description,
      serviceDate: input.serviceDate ? new Date(input.serviceDate) : new Date(),
      odometerAtService: input.odometerAtService ?? undefined,
      serviceProvider: input.serviceProvider || undefined,
      partsCost,
      laborCost,
      totalCost,
      nextServiceDate: input.nextServiceDate ? new Date(input.nextServiceDate) : undefined,
      nextServiceOdometer: input.nextServiceOdometer ?? undefined,
      status: input.status,
      notes: input.notes || undefined,
      isArchived: false,
    });

    await maintenance.save();

    // If maintenance is IN_PROGRESS, set vehicle status to IN_MAINTENANCE
    if (input.status === 'IN_PROGRESS') {
      vehicle.status = 'IN_MAINTENANCE';
    }

    // If odometer reading at service is higher than vehicle's current odometer, update it
    if (input.odometerAtService && input.odometerAtService > vehicle.currentOdometer) {
      vehicle.currentOdometer = input.odometerAtService;
    }

    await vehicle.save();
    return maintenance;
  }

  static async updateMaintenance(
    companyId: mongoose.Types.ObjectId,
    id: string,
    input: UpdateMaintenanceInput
  ): Promise<IMaintenance> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance record ID format.');
    }

    const record = await Maintenance.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!record) {
      throw new Error('Maintenance record not found.');
    }

    const vehicle = await Vehicle.findOne({
      _id: record.vehicleId,
      companyId,
      isArchived: false,
    });

    if (input.serviceType) record.serviceType = input.serviceType;
    if (input.description) record.description = input.description;
    if (input.serviceDate) record.serviceDate = new Date(input.serviceDate);
    if (input.odometerAtService !== undefined) record.odometerAtService = input.odometerAtService ?? undefined;
    if (input.serviceProvider !== undefined) record.serviceProvider = input.serviceProvider || undefined;
    if (input.partsCost !== undefined) record.partsCost = Number(input.partsCost);
    if (input.laborCost !== undefined) record.laborCost = Number(input.laborCost);
    if (input.totalCost !== undefined) {
      record.totalCost = Number(input.totalCost);
    } else if (input.partsCost !== undefined || input.laborCost !== undefined) {
      record.totalCost = record.partsCost + record.laborCost;
    }
    if (input.nextServiceDate !== undefined) {
      record.nextServiceDate = input.nextServiceDate ? new Date(input.nextServiceDate) : undefined;
    }
    if (input.nextServiceOdometer !== undefined) {
      record.nextServiceOdometer = input.nextServiceOdometer ?? undefined;
    }
    if (input.notes !== undefined) record.notes = input.notes || undefined;

    const previousStatus = record.status;
    if (input.status) {
      record.status = input.status;
    }

    await record.save();

    // Handle vehicle status transitions
    if (vehicle) {
      if (record.status === 'IN_PROGRESS') {
        vehicle.status = 'IN_MAINTENANCE';
        await vehicle.save();
      } else if (
        previousStatus === 'IN_PROGRESS' &&
        (record.status === 'COMPLETED' || record.status === 'CANCELLED')
      ) {
        // Check if other IN_PROGRESS maintenance exists
        const otherActive = await Maintenance.countDocuments({
          companyId,
          vehicleId: vehicle._id,
          _id: { $ne: record._id },
          status: 'IN_PROGRESS',
          isArchived: false,
        });
        if (otherActive === 0 && vehicle.status === 'IN_MAINTENANCE') {
          vehicle.status = 'ACTIVE';
          await vehicle.save();
        }
      }

      if (record.odometerAtService && record.odometerAtService > vehicle.currentOdometer) {
        vehicle.currentOdometer = record.odometerAtService;
        await vehicle.save();
      }
    }

    return record;
  }

  static async archiveMaintenance(companyId: mongoose.Types.ObjectId, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance record ID format.');
    }

    const record = await Maintenance.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!record) {
      throw new Error('Maintenance record not found.');
    }

    record.isArchived = true;
    await record.save();

    // Check if vehicle status needs reverting
    if (record.status === 'IN_PROGRESS') {
      const otherActive = await Maintenance.countDocuments({
        companyId,
        vehicleId: record.vehicleId,
        _id: { $ne: record._id },
        status: 'IN_PROGRESS',
        isArchived: false,
      });
      if (otherActive === 0) {
        await Vehicle.findByIdAndUpdate(record.vehicleId, { status: 'ACTIVE' });
      }
    }
  }
}
