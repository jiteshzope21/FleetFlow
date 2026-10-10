import mongoose from 'mongoose';
import { Trip, ITrip } from '../../models/Trip.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { Shipment } from '../../models/Shipment.js';
import {
  CreateTripInput,
  UpdateTripInput,
  StartTripInput,
  CompleteTripInput,
  QueryTripInput,
} from './trip.validator.js';
import { AppError } from '../../utils/apiResponse.js';

export class TripService {
  static async createTrip(
    companyId: mongoose.Types.ObjectId,
    input: CreateTripInput
  ): Promise<ITrip> {
    const vehicleObjectId = new mongoose.Types.ObjectId(input.vehicleId);
    const driverObjectId = new mongoose.Types.ObjectId(input.driverId);

    // 1. Verify vehicle exists and belongs to company
    const vehicle = await Vehicle.findOne({
      _id: vehicleObjectId,
      companyId,
      isArchived: false,
    });
    if (!vehicle) {
      throw new AppError('Vehicle not found or does not belong to this company', 400);
    }
    if (vehicle.status === 'IN_MAINTENANCE') {
      throw new AppError(`Vehicle ${vehicle.registrationNumber} is currently undergoing maintenance and cannot be dispatched`, 400);
    }
    if (vehicle.status === 'INACTIVE') {
      throw new AppError(`Vehicle ${vehicle.registrationNumber} is inactive`, 400);
    }

    // 2. Check conflicting active trips for vehicle
    const vehicleConflict = await Trip.findOne({
      companyId,
      vehicleId: vehicleObjectId,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
      isArchived: false,
    });
    if (vehicleConflict) {
      throw new AppError(
        `Vehicle ${vehicle.registrationNumber} is already assigned to active trip ${vehicleConflict.tripNumber}`,
        400
      );
    }

    // 3. Verify driver exists and belongs to company
    const driver = await Driver.findOne({
      _id: driverObjectId,
      companyId,
      isArchived: false,
    });
    if (!driver) {
      throw new AppError('Driver not found or does not belong to this company', 400);
    }
    if (driver.status !== 'ACTIVE') {
      throw new AppError(`Driver ${driver.name} is not available (status: ${driver.status})`, 400);
    }

    // 4. Check conflicting active trips for driver
    const driverConflict = await Trip.findOne({
      companyId,
      driverId: driverObjectId,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
      isArchived: false,
    });
    if (driverConflict) {
      throw new AppError(
        `Driver ${driver.name} is already assigned to active trip ${driverConflict.tripNumber}`,
        400
      );
    }

    // 5. Verify shipments exist and belong to company
    const shipmentObjectIds: mongoose.Types.ObjectId[] = [];
    if (input.shipmentIds && input.shipmentIds.length > 0) {
      for (const sId of input.shipmentIds) {
        const shipmentDoc = await Shipment.findOne({
          _id: new mongoose.Types.ObjectId(sId),
          companyId,
          isArchived: false,
        });
        if (!shipmentDoc) {
          throw new AppError(`Shipment ${sId} not found or does not belong to this company`, 400);
        }
        if (shipmentDoc.status === 'DELIVERED' || shipmentDoc.status === 'CANCELLED') {
          throw new AppError(`Shipment ${shipmentDoc.shipmentNumber} is ${shipmentDoc.status} and cannot be assigned`, 400);
        }
        shipmentObjectIds.push(shipmentDoc._id as mongoose.Types.ObjectId);
      }
    }

    // Auto-generate or uppercase trip number
    const tripNumber =
      input.tripNumber?.trim().toUpperCase() ||
      `TRP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const existingTrip = await Trip.findOne({
      companyId,
      tripNumber,
      isArchived: false,
    });
    if (existingTrip) {
      throw new AppError(`Trip reference "${tripNumber}" already exists`, 400);
    }

    const trip = await Trip.create({
      companyId,
      tripNumber,
      vehicleId: vehicleObjectId,
      driverId: driverObjectId,
      shipmentIds: shipmentObjectIds,
      originCity: input.originCity,
      destinationCity: input.destinationCity,
      stops: input.stops || [],
      status: 'ASSIGNED',
      plannedDepartureDate: new Date(input.plannedDepartureDate),
      plannedArrivalDate: new Date(input.plannedArrivalDate),
      startOdometer: vehicle.currentOdometer,
      estimatedDistanceKm: input.estimatedDistanceKm,
      estimatedCost: input.estimatedCost || 0,
      costBreakdown: input.costBreakdown || {},
      notes: input.notes || undefined,
      isArchived: false,
    });

    // Link assigned shipments
    if (shipmentObjectIds.length > 0) {
      await Shipment.updateMany(
        { _id: { $in: shipmentObjectIds }, companyId },
        {
          assignedVehicleId: vehicleObjectId,
          assignedDriverId: driverObjectId,
          tripId: trip._id,
          status: 'ASSIGNED',
        }
      );
    }

    return (await trip.populate([
      { path: 'vehicleId', select: 'registrationNumber make model currentOdometer status type' },
      { path: 'driverId', select: 'name phone licenseNumber status' },
      { path: 'shipmentIds', select: 'shipmentNumber cargoDescription weightKg agreedPrice status' },
    ])) as unknown as ITrip;
  }

  static async getTrips(companyId: mongoose.Types.ObjectId, query: QueryTripInput) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { companyId, isArchived: false };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.vehicleId) {
      filter.vehicleId = new mongoose.Types.ObjectId(query.vehicleId);
    }
    if (query.driverId) {
      filter.driverId = new mongoose.Types.ObjectId(query.driverId);
    }
    if (query.search) {
      filter.$or = [
        { tripNumber: { $regex: query.search, $options: 'i' } },
        { originCity: { $regex: query.search, $options: 'i' } },
        { destinationCity: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('vehicleId', 'registrationNumber make model currentOdometer status type')
        .populate('driverId', 'name phone licenseNumber status')
        .populate('shipmentIds', 'shipmentNumber cargoDescription weightKg agreedPrice status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Trip.countDocuments(filter),
    ]);

    return {
      trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTripById(
    companyId: mongoose.Types.ObjectId,
    tripId: string
  ): Promise<ITrip> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findOne({
      _id: new mongoose.Types.ObjectId(tripId),
      companyId,
      isArchived: false,
    })
      .populate('vehicleId', 'registrationNumber make model currentOdometer status type fuelType')
      .populate('driverId', 'name phone licenseNumber status')
      .populate('shipmentIds', 'shipmentNumber origin destination cargoDescription weightKg agreedPrice status deliveryConfirmation');

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    return trip as unknown as ITrip;
  }

  static async startTrip(
    companyId: mongoose.Types.ObjectId,
    tripId: string,
    input: StartTripInput
  ): Promise<ITrip> {
    const trip = await this.getTripById(companyId, tripId);

    if (trip.status !== 'PLANNED' && trip.status !== 'ASSIGNED') {
      throw new AppError(`Cannot start trip in "${trip.status}" status`, 400);
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const startOdo = input.startOdometer !== undefined ? input.startOdometer : (vehicle?.currentOdometer || 0);

    trip.status = 'IN_PROGRESS';
    trip.actualDepartureDate = input.actualDepartureDate ? new Date(input.actualDepartureDate) : new Date();
    trip.startOdometer = startOdo;

    await (trip as any).save();

    // Mark shipments as IN_TRANSIT
    if (trip.shipmentIds && trip.shipmentIds.length > 0) {
      await Shipment.updateMany(
        { _id: { $in: trip.shipmentIds }, companyId },
        { status: 'IN_TRANSIT' }
      );
    }

    return (await (trip as any).populate([
      { path: 'vehicleId', select: 'registrationNumber make model currentOdometer status type' },
      { path: 'driverId', select: 'name phone' },
      { path: 'shipmentIds', select: 'shipmentNumber status' },
    ])) as unknown as ITrip;
  }

  static async completeTrip(
    companyId: mongoose.Types.ObjectId,
    tripId: string,
    input: CompleteTripInput
  ): Promise<ITrip> {
    const trip = await this.getTripById(companyId, tripId);

    if (trip.status !== 'IN_PROGRESS') {
      throw new AppError(`Cannot complete trip in "${trip.status}" status (must be IN_PROGRESS)`, 400);
    }

    const actualArrival = input.actualArrivalDate ? new Date(input.actualArrivalDate) : new Date();
    trip.status = 'COMPLETED';
    trip.actualArrivalDate = actualArrival;

    if (input.endOdometer !== undefined) {
      trip.endOdometer = input.endOdometer;
      if (trip.startOdometer !== undefined && input.endOdometer >= trip.startOdometer) {
        trip.actualDistanceKm = input.endOdometer - trip.startOdometer;
      }
    }

    if (input.costBreakdown) {
      trip.costBreakdown = input.costBreakdown;
      const computedTotal =
        (input.costBreakdown.fuelCost || 0) +
        (input.costBreakdown.tollCost || 0) +
        (input.costBreakdown.driverAllowance || 0) +
        (input.costBreakdown.maintenanceCost || 0) +
        (input.costBreakdown.otherCost || 0);
      trip.actualCost = input.actualCost !== undefined ? input.actualCost : computedTotal;
    } else if (input.actualCost !== undefined) {
      trip.actualCost = input.actualCost;
    }

    if (input.notes) trip.notes = input.notes;

    await (trip as any).save();

    // Forward odometer progression on vehicle if valid
    if (trip.endOdometer !== undefined) {
      const vehicle = await Vehicle.findById(trip.vehicleId);
      if (vehicle && trip.endOdometer > vehicle.currentOdometer) {
        vehicle.currentOdometer = trip.endOdometer;
        await vehicle.save();
      }
    }

    // Auto-confirm shipments if not already delivered
    if (trip.shipmentIds && trip.shipmentIds.length > 0) {
      await Shipment.updateMany(
        { _id: { $in: trip.shipmentIds }, companyId, status: { $ne: 'DELIVERED' } },
        {
          status: 'DELIVERED',
          deliveryConfirmation: {
            deliveredAt: actualArrival,
            recipientName: 'Consignee (Trip Completion)',
            notes: `Auto-confirmed upon Trip ${trip.tripNumber} completion`,
          },
        }
      );
    }

    return (await (trip as any).populate([
      { path: 'vehicleId', select: 'registrationNumber make model currentOdometer status type' },
      { path: 'driverId', select: 'name phone' },
      { path: 'shipmentIds', select: 'shipmentNumber status' },
    ])) as unknown as ITrip;
  }

  static async cancelTrip(
    companyId: mongoose.Types.ObjectId,
    tripId: string,
    reason?: string
  ): Promise<ITrip> {
    const trip = await this.getTripById(companyId, tripId);

    if (trip.status === 'COMPLETED') {
      throw new AppError('Cannot cancel a trip that has already been completed', 400);
    }

    trip.status = 'CANCELLED';
    if (reason) {
      trip.notes = trip.notes ? `${trip.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`;
    }
    await (trip as any).save();

    // Release assigned shipments back to PENDING
    if (trip.shipmentIds && trip.shipmentIds.length > 0) {
      await Shipment.updateMany(
        { _id: { $in: trip.shipmentIds }, companyId, status: { $ne: 'DELIVERED' } },
        {
          assignedVehicleId: null,
          assignedDriverId: null,
          tripId: null,
          status: 'PENDING',
        }
      );
    }

    return trip;
  }

  static async updateTrip(
    companyId: mongoose.Types.ObjectId,
    tripId: string,
    input: UpdateTripInput
  ): Promise<ITrip> {
    const trip = await this.getTripById(companyId, tripId);

    if (input.originCity) trip.originCity = input.originCity;
    if (input.destinationCity) trip.destinationCity = input.destinationCity;
    if (input.estimatedDistanceKm !== undefined) trip.estimatedDistanceKm = input.estimatedDistanceKm;
    if (input.estimatedCost !== undefined) trip.estimatedCost = input.estimatedCost;
    if (input.notes !== undefined) trip.notes = input.notes || undefined;
    if (input.stops) trip.stops = input.stops as any;

    await (trip as any).save();
    return trip;
  }

  static async archiveTrip(
    companyId: mongoose.Types.ObjectId,
    tripId: string
  ): Promise<void> {
    const trip = await this.getTripById(companyId, tripId);
    if (trip.status === 'IN_PROGRESS') {
      throw new AppError('Cannot archive a trip that is currently in progress', 400);
    }
    (trip as any).isArchived = true;
    await (trip as any).save();
  }
}
