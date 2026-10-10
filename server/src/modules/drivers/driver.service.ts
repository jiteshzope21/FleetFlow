import mongoose from 'mongoose';
import { Driver, IDriver } from '../../models/Driver.js';
import { Vehicle } from '../../models/Vehicle.js';
import { CreateDriverInput, UpdateDriverInput, DriverQueryInput } from './driver.validator.js';

export class DriverService {
  static async getDrivers(companyId: mongoose.Types.ObjectId, query: DriverQueryInput) {
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

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { licenseNumber: searchRegex },
      ];
    }

    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .populate('assignedVehicleId', 'registrationNumber make model status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(filter),
    ]);

    return {
      drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getDriverById(companyId: mongoose.Types.ObjectId, id: string): Promise<IDriver> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid driver ID format.');
    }

    const driver = await Driver.findOne({
      _id: id,
      companyId,
      isArchived: false,
    }).populate('assignedVehicleId', 'registrationNumber make model status');

    if (!driver) {
      throw new Error('Driver not found.');
    }

    return driver;
  }

  static async createDriver(companyId: mongoose.Types.ObjectId, input: CreateDriverInput): Promise<IDriver> {
    const licenseNumber = input.licenseNumber.toUpperCase().trim();

    // Check duplicate license number within tenant
    const existing = await Driver.findOne({
      companyId,
      licenseNumber,
      isArchived: false,
    });

    if (existing) {
      throw new Error(`Driver with license number "${licenseNumber}" already exists in your company.`);
    }

    // Verify assigned vehicle if provided
    let vehicleObjectId: mongoose.Types.ObjectId | null = null;
    if (input.assignedVehicleId) {
      if (!mongoose.Types.ObjectId.isValid(input.assignedVehicleId)) {
        throw new Error('Invalid assigned vehicle ID.');
      }
      const vehicle = await Vehicle.findOne({
        _id: input.assignedVehicleId,
        companyId,
        isArchived: false,
      });
      if (!vehicle) {
        throw new Error('Referenced vehicle not found in your fleet.');
      }
      vehicleObjectId = vehicle._id as mongoose.Types.ObjectId;
    }

    const formatEmergency = (em?: any) => {
      if (!em) return undefined;
      return {
        name: em.name || undefined,
        phone: em.phone || undefined,
        relation: em.relation || undefined,
      };
    };

    const driver = new Driver({
      companyId,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      licenseNumber,
      licenseCategory: input.licenseCategory,
      licenseExpiryDate: new Date(input.licenseExpiryDate),
      address: input.address || undefined,
      dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : new Date(),
      status: input.status,
      assignedVehicleId: vehicleObjectId,
      emergencyContact: formatEmergency(input.emergencyContact),
      notes: input.notes || undefined,
      isArchived: false,
    });

    await driver.save();

    // If assigned to a vehicle, update vehicle's assignedDriverId
    if (vehicleObjectId) {
      await Vehicle.findByIdAndUpdate(vehicleObjectId, { assignedDriverId: driver._id });
    }

    return driver;
  }

  static async updateDriver(
    companyId: mongoose.Types.ObjectId,
    id: string,
    input: UpdateDriverInput
  ): Promise<IDriver> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid driver ID format.');
    }

    const driver = await Driver.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!driver) {
      throw new Error('Driver not found.');
    }

    if (input.licenseNumber) {
      const licenseNumber = input.licenseNumber.toUpperCase().trim();
      if (licenseNumber !== driver.licenseNumber) {
        const existing = await Driver.findOne({
          companyId,
          licenseNumber,
          isArchived: false,
          _id: { $ne: driver._id },
        });
        if (existing) {
          throw new Error(`Driver with license number "${licenseNumber}" already exists in your company.`);
        }
        driver.licenseNumber = licenseNumber;
      }
    }

    if (input.assignedVehicleId !== undefined) {
      if (input.assignedVehicleId) {
        if (!mongoose.Types.ObjectId.isValid(input.assignedVehicleId)) {
          throw new Error('Invalid assigned vehicle ID.');
        }
        const vehicle = await Vehicle.findOne({
          _id: input.assignedVehicleId,
          companyId,
          isArchived: false,
        });
        if (!vehicle) {
          throw new Error('Referenced vehicle not found in your fleet.');
        }
        driver.assignedVehicleId = vehicle._id as mongoose.Types.ObjectId;
        await Vehicle.findByIdAndUpdate(vehicle._id, { assignedDriverId: driver._id });
      } else {
        if (driver.assignedVehicleId) {
          await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { assignedDriverId: null });
        }
        driver.assignedVehicleId = null;
      }
    }

    const formatEmergency = (em?: any) => {
      if (!em) return undefined;
      return {
        name: em.name || undefined,
        phone: em.phone || undefined,
        relation: em.relation || undefined,
      };
    };

    if (input.name) driver.name = input.name;
    if (input.phone) driver.phone = input.phone;
    if (input.email !== undefined) driver.email = input.email || undefined;
    if (input.licenseCategory) driver.licenseCategory = input.licenseCategory;
    if (input.licenseExpiryDate) driver.licenseExpiryDate = new Date(input.licenseExpiryDate);
    if (input.address !== undefined) driver.address = input.address || undefined;
    if (input.dateOfJoining) driver.dateOfJoining = new Date(input.dateOfJoining);
    if (input.status) driver.status = input.status;
    if (input.emergencyContact !== undefined) driver.emergencyContact = formatEmergency(input.emergencyContact);
    if (input.notes !== undefined) driver.notes = input.notes || undefined;

    await driver.save();
    return driver;
  }

  static async archiveDriver(companyId: mongoose.Types.ObjectId, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid driver ID format.');
    }

    const driver = await Driver.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!driver) {
      throw new Error('Driver not found.');
    }

    driver.isArchived = true;
    driver.status = 'INACTIVE';
    if (driver.assignedVehicleId) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { assignedDriverId: null });
      driver.assignedVehicleId = null;
    }

    await driver.save();
  }
}
