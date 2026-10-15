import mongoose from 'mongoose';
import { Vehicle, IVehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { Subscription } from '../../models/Subscription.js';
import { CreateVehicleInput, UpdateVehicleInput, VehicleQueryInput } from './vehicle.validator.js';

export class VehicleService {
  static async getVehicles(companyId: mongoose.Types.ObjectId, query: VehicleQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      companyId,
      isArchived: false,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.fuelType) {
      filter.fuelType = query.fuelType;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { registrationNumber: searchRegex },
        { make: searchRegex },
        { model: searchRegex },
      ];
    }

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('assignedDriverId', 'name phone licenseNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    return {
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getVehicleById(companyId: mongoose.Types.ObjectId, id: string): Promise<IVehicle> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid vehicle ID format.');
    }

    const vehicle = await Vehicle.findOne({
      _id: id,
      companyId,
      isArchived: false,
    }).populate('assignedDriverId', 'name phone licenseNumber status');

    if (!vehicle) {
      throw new Error('Vehicle not found.');
    }

    return vehicle;
  }

  static async createVehicle(companyId: mongoose.Types.ObjectId, input: CreateVehicleInput): Promise<IVehicle> {
    const regNumber = input.registrationNumber.toUpperCase().trim();

    // Check for existing active vehicle with same registration number in tenant
    const existing = await Vehicle.findOne({
      companyId,
      registrationNumber: regNumber,
      isArchived: false,
    });

    if (existing) {
      throw new Error(`Vehicle with registration number "${regNumber}" already exists in your fleet.`);
    }

    // Enforce subscription plan vehicle limit if an active subscription exists
    const sub = await Subscription.findOne({ companyId, status: { $in: ['ACTIVE', 'TRIAL'] } }).populate('planId');
    if (sub && sub.planId) {
      const plan = sub.planId as any;
      if (typeof plan.maxVehicles === 'number') {
        const currentCount = await Vehicle.countDocuments({ companyId, isArchived: false });
        if (currentCount >= plan.maxVehicles) {
          throw new Error(`Vehicle limit reached for your ${plan.name} plan (Max: ${plan.maxVehicles} vehicles). Upgrade your plan to add more fleet vehicles.`);
        }
      }
    }

    // Verify driver assignment if supplied
    let driverObjectId: mongoose.Types.ObjectId | null = null;
    if (input.assignedDriverId) {
      if (!mongoose.Types.ObjectId.isValid(input.assignedDriverId)) {
        throw new Error('Invalid assigned driver ID.');
      }
      const driver = await Driver.findOne({
        _id: input.assignedDriverId,
        companyId,
        isArchived: false,
      });
      if (!driver) {
        throw new Error('Referenced driver not found in your company.');
      }
      driverObjectId = driver._id as mongoose.Types.ObjectId;
    }

    const vehicle = new Vehicle({
      companyId,
      registrationNumber: regNumber,
      type: input.type,
      make: input.make,
      model: input.model,
      year: input.year,
      fuelType: input.fuelType,
      currentOdometer: input.currentOdometer,
      status: input.status,
      assignedDriverId: driverObjectId,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchasePrice: input.purchasePrice ?? undefined,
      insuranceExpiryDate: input.insuranceExpiryDate ? new Date(input.insuranceExpiryDate) : undefined,
      registrationExpiryDate: input.registrationExpiryDate ? new Date(input.registrationExpiryDate) : undefined,
      pollutionExpiryDate: input.pollutionExpiryDate ? new Date(input.pollutionExpiryDate) : undefined,
      notes: input.notes ?? undefined,
      isArchived: false,
    });

    await vehicle.save();

    // If a driver was assigned, also update driver's assignedVehicleId
    if (driverObjectId) {
      await Driver.findByIdAndUpdate(driverObjectId, { assignedVehicleId: vehicle._id });
    }

    return vehicle;
  }

  static async updateVehicle(
    companyId: mongoose.Types.ObjectId,
    id: string,
    input: UpdateVehicleInput
  ): Promise<IVehicle> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid vehicle ID format.');
    }

    const vehicle = await Vehicle.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!vehicle) {
      throw new Error('Vehicle not found.');
    }

    if (input.registrationNumber) {
      const regNumber = input.registrationNumber.toUpperCase().trim();
      if (regNumber !== vehicle.registrationNumber) {
        const existing = await Vehicle.findOne({
          companyId,
          registrationNumber: regNumber,
          isArchived: false,
          _id: { $ne: vehicle._id },
        });
        if (existing) {
          throw new Error(`Vehicle with registration number "${regNumber}" already exists in your fleet.`);
        }
        vehicle.registrationNumber = regNumber;
      }
    }

    if (input.assignedDriverId !== undefined) {
      if (input.assignedDriverId) {
        if (!mongoose.Types.ObjectId.isValid(input.assignedDriverId)) {
          throw new Error('Invalid assigned driver ID.');
        }
        const driver = await Driver.findOne({
          _id: input.assignedDriverId,
          companyId,
          isArchived: false,
        });
        if (!driver) {
          throw new Error('Referenced driver not found in your company.');
        }

        // 1. If this vehicle previously had a different driver, clear old driver's vehicle pointer
        if (vehicle.assignedDriverId && vehicle.assignedDriverId.toString() !== driver._id.toString()) {
          await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { assignedVehicleId: null });
        }

        // 2. If the target driver previously had another vehicle, clear that vehicle's driver pointer
        if (driver.assignedVehicleId && driver.assignedVehicleId.toString() !== vehicle._id.toString()) {
          await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { assignedDriverId: null });
        }

        vehicle.assignedDriverId = driver._id as mongoose.Types.ObjectId;
        await Driver.findByIdAndUpdate(driver._id, { assignedVehicleId: vehicle._id });
      } else {
        // Unassigning
        if (vehicle.assignedDriverId) {
          await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { assignedVehicleId: null });
        }
        vehicle.assignedDriverId = null;
      }
    }

    if (input.type) vehicle.type = input.type;
    if (input.make) vehicle.make = input.make;
    if (input.model) vehicle.set('model', input.model);
    if (input.year) vehicle.year = input.year;
    if (input.fuelType) vehicle.fuelType = input.fuelType;
    if (input.currentOdometer !== undefined) vehicle.currentOdometer = input.currentOdometer;
    if (input.status) vehicle.status = input.status;
    if (input.purchaseDate !== undefined) {
      vehicle.purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : undefined;
    }
    if (input.purchasePrice !== undefined) vehicle.purchasePrice = input.purchasePrice ?? undefined;
    if (input.insuranceExpiryDate !== undefined) {
      vehicle.insuranceExpiryDate = input.insuranceExpiryDate ? new Date(input.insuranceExpiryDate) : undefined;
    }
    if (input.registrationExpiryDate !== undefined) {
      vehicle.registrationExpiryDate = input.registrationExpiryDate ? new Date(input.registrationExpiryDate) : undefined;
    }
    if (input.pollutionExpiryDate !== undefined) {
      vehicle.pollutionExpiryDate = input.pollutionExpiryDate ? new Date(input.pollutionExpiryDate) : undefined;
    }
    if (input.notes !== undefined) vehicle.notes = input.notes ?? undefined;

    await vehicle.save();
    return vehicle;
  }

  static async archiveVehicle(companyId: mongoose.Types.ObjectId, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid vehicle ID format.');
    }

    const vehicle = await Vehicle.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!vehicle) {
      throw new Error('Vehicle not found.');
    }

    vehicle.isArchived = true;
    vehicle.status = 'INACTIVE';
    if (vehicle.assignedDriverId) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { assignedVehicleId: null });
      vehicle.assignedDriverId = null;
    }

    await vehicle.save();
  }
}
