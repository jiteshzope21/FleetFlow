import mongoose from 'mongoose';
import { FuelLog, IFuelLog } from '../../models/FuelLog.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { CreateFuelLogInput, UpdateFuelLogInput, FuelQueryInput } from './fuel.validator.js';

export class FuelService {
  static async getFuelLogs(companyId: mongoose.Types.ObjectId, query: FuelQueryInput) {
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

    if (query.driverId && mongoose.Types.ObjectId.isValid(query.driverId)) {
      filter.driverId = new mongoose.Types.ObjectId(query.driverId);
    }

    if (query.fuelType) {
      filter.fuelType = query.fuelType;
    }

    const [logs, total, aggregates] = await Promise.all([
      FuelLog.find(filter)
        .populate('vehicleId', 'registrationNumber make model currentOdometer')
        .populate('driverId', 'name phone')
        .sort({ refuelingDate: -1, odometer: -1 })
        .skip(skip)
        .limit(limit),
      FuelLog.countDocuments(filter),
      FuelLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$totalCost' },
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ]),
    ]);

    const totalFuelCost = aggregates[0]?.totalCost || 0;
    const totalFuelQuantity = aggregates[0]?.totalQuantity || 0;
    const avgCostPerLiter = totalFuelQuantity > 0 ? totalFuelCost / totalFuelQuantity : 0;

    return {
      logs,
      summary: {
        totalFuelCost,
        totalFuelQuantity,
        avgCostPerLiter: parseFloat(avgCostPerLiter.toFixed(2)),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getFuelLogById(companyId: mongoose.Types.ObjectId, id: string): Promise<IFuelLog> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid fuel log ID format.');
    }

    const log = await FuelLog.findOne({
      _id: id,
      companyId,
      isArchived: false,
    })
      .populate('vehicleId', 'registrationNumber make model currentOdometer')
      .populate('driverId', 'name phone');

    if (!log) {
      throw new Error('Fuel log record not found.');
    }

    return log;
  }

  static async createFuelLog(companyId: mongoose.Types.ObjectId, input: CreateFuelLogInput): Promise<IFuelLog> {
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

    // Verify driver if provided
    let driverObjectId: mongoose.Types.ObjectId | null = null;
    if (input.driverId) {
      if (!mongoose.Types.ObjectId.isValid(input.driverId)) {
        throw new Error('Invalid driver ID format.');
      }
      const driver = await Driver.findOne({
        _id: input.driverId,
        companyId,
        isArchived: false,
      });
      if (!driver) {
        throw new Error('Referenced driver not found in your company.');
      }
      driverObjectId = driver._id as mongoose.Types.ObjectId;
    }

    const quantity = Number(input.quantity);
    let pricePerUnit = input.pricePerUnit !== undefined && input.pricePerUnit !== null ? Number(input.pricePerUnit) : undefined;
    let totalCost = input.totalCost !== undefined && input.totalCost !== null ? Number(input.totalCost) : 0;

    if (pricePerUnit !== undefined && pricePerUnit > 0) {
      totalCost = Number((quantity * pricePerUnit).toFixed(2));
    } else if (totalCost > 0 && quantity > 0) {
      pricePerUnit = Number((totalCost / quantity).toFixed(2));
    }

    const odometer = Number(input.odometer);

    // Odometer regression safety: ensure odometer reading isn't negative or dramatically lower than baseline
    if (odometer < 0) {
      throw new Error('Odometer reading cannot be negative.');
    }

    const fuelLog = new FuelLog({
      companyId,
      vehicleId: vehicle._id,
      driverId: driverObjectId,
      refuelingDate: input.refuelingDate ? new Date(input.refuelingDate) : new Date(),
      fuelType: input.fuelType,
      quantity,
      pricePerUnit,
      totalCost,
      odometer,
      fuelStation: input.fuelStation || undefined,
      invoiceNumber: input.invoiceNumber || undefined,
      notes: input.notes || undefined,
      isArchived: false,
    });

    await fuelLog.save();

    // Safely update vehicle odometer if reading is higher
    if (odometer > vehicle.currentOdometer) {
      vehicle.currentOdometer = odometer;
      await vehicle.save();
    }

    return fuelLog;
  }

  static async updateFuelLog(
    companyId: mongoose.Types.ObjectId,
    id: string,
    input: UpdateFuelLogInput
  ): Promise<IFuelLog> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid fuel log ID format.');
    }

    const log = await FuelLog.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!log) {
      throw new Error('Fuel log record not found.');
    }

    if (input.vehicleId && input.vehicleId !== log.vehicleId.toString()) {
      const vehicle = await Vehicle.findOne({
        _id: input.vehicleId,
        companyId,
        isArchived: false,
      });
      if (!vehicle) {
        throw new Error('Referenced vehicle not found in your fleet.');
      }
      log.vehicleId = vehicle._id as mongoose.Types.ObjectId;
    }

    if (input.driverId !== undefined) {
      if (input.driverId) {
        const driver = await Driver.findOne({
          _id: input.driverId,
          companyId,
          isArchived: false,
        });
        if (!driver) {
          throw new Error('Referenced driver not found in your company.');
        }
        log.driverId = driver._id as mongoose.Types.ObjectId;
      } else {
        log.driverId = null;
      }
    }

    if (input.refuelingDate) log.refuelingDate = new Date(input.refuelingDate);
    if (input.fuelType) log.fuelType = input.fuelType;
    if (input.quantity) log.quantity = Number(input.quantity);
    if (input.pricePerUnit !== undefined) {
      log.pricePerUnit = input.pricePerUnit !== null ? Number(input.pricePerUnit) : undefined;
    }
    if (input.totalCost !== undefined) {
      log.totalCost = Number(input.totalCost);
    } else if (log.pricePerUnit && log.quantity) {
      log.totalCost = Number((log.pricePerUnit * log.quantity).toFixed(2));
    }
    if (input.odometer !== undefined) log.odometer = Number(input.odometer);
    if (input.fuelStation !== undefined) log.fuelStation = input.fuelStation || undefined;
    if (input.invoiceNumber !== undefined) log.invoiceNumber = input.invoiceNumber || undefined;
    if (input.notes !== undefined) log.notes = input.notes || undefined;

    await log.save();
    return log;
  }

  static async archiveFuelLog(companyId: mongoose.Types.ObjectId, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid fuel log ID format.');
    }

    const log = await FuelLog.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!log) {
      throw new Error('Fuel log record not found.');
    }

    log.isArchived = true;
    await log.save();
  }
}
