import mongoose from 'mongoose';
import { Shipment, IShipment } from '../../models/Shipment.js';
import { Customer } from '../../models/Customer.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import {
  CreateShipmentInput,
  UpdateShipmentInput,
  ConfirmDeliveryInput,
  QueryShipmentInput,
} from './shipment.validator.js';
import { AppError } from '../../utils/apiResponse.js';

export class ShipmentService {
  static async createShipment(
    companyId: mongoose.Types.ObjectId,
    input: CreateShipmentInput
  ): Promise<IShipment> {
    // Verify customer belongs to same tenant
    const customer = await Customer.findOne({
      _id: new mongoose.Types.ObjectId(input.customerId),
      companyId,
      isArchived: false,
    });
    if (!customer) {
      throw new AppError('Customer not found or does not belong to this company', 400);
    }

    // Verify assigned vehicle if provided
    let vehicleId: mongoose.Types.ObjectId | null = null;
    if (input.assignedVehicleId) {
      const vehicle = await Vehicle.findOne({
        _id: new mongoose.Types.ObjectId(input.assignedVehicleId),
        companyId,
        isArchived: false,
      });
      if (!vehicle) {
        throw new AppError('Vehicle not found or does not belong to this company', 400);
      }
      vehicleId = vehicle._id as mongoose.Types.ObjectId;
    }

    // Verify assigned driver if provided
    let driverId: mongoose.Types.ObjectId | null = null;
    if (input.assignedDriverId) {
      const driver = await Driver.findOne({
        _id: new mongoose.Types.ObjectId(input.assignedDriverId),
        companyId,
        isArchived: false,
      });
      if (!driver) {
        throw new AppError('Driver not found or does not belong to this company', 400);
      }
      driverId = driver._id as mongoose.Types.ObjectId;
    }

    // Auto-generate or uppercase shipment number
    const shipmentNumber =
      input.shipmentNumber?.trim().toUpperCase() ||
      `SHP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // Check duplicate shipment number in company
    const existing = await Shipment.findOne({
      companyId,
      shipmentNumber,
      isArchived: false,
    });
    if (existing) {
      throw new AppError(`Shipment with reference "${shipmentNumber}" already exists`, 400);
    }

    const shipment = await Shipment.create({
      companyId,
      shipmentNumber,
      customerId: customer._id,
      origin: input.origin,
      destination: input.destination,
      cargoDescription: input.cargoDescription,
      cargoCategory: input.cargoCategory,
      weightKg: input.weightKg,
      volumeCbm: input.volumeCbm || undefined,
      priority: input.priority,
      status: vehicleId && driverId ? 'ASSIGNED' : 'PENDING',
      estimatedCost: input.estimatedCost || 0,
      agreedPrice: input.agreedPrice,
      assignedVehicleId: vehicleId,
      assignedDriverId: driverId,
      pickupDate: input.pickupDate ? new Date(input.pickupDate) : undefined,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
      specialInstructions: input.specialInstructions || undefined,
      notes: input.notes || undefined,
      isArchived: false,
    });

    return (await shipment.populate([
      { path: 'customerId', select: 'name contactPerson phone email' },
      { path: 'assignedVehicleId', select: 'registrationNumber make model type' },
      { path: 'assignedDriverId', select: 'name phone licenseNumber' },
    ])) as unknown as IShipment;
  }

  static async getShipments(
    companyId: mongoose.Types.ObjectId,
    query: QueryShipmentInput
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { companyId, isArchived: false };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.customerId) {
      filter.customerId = new mongoose.Types.ObjectId(query.customerId);
    }
    if (query.search) {
      filter.$or = [
        { shipmentNumber: { $regex: query.search, $options: 'i' } },
        { cargoDescription: { $regex: query.search, $options: 'i' } },
        { 'origin.city': { $regex: query.search, $options: 'i' } },
        { 'destination.city': { $regex: query.search, $options: 'i' } },
      ];
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(filter)
        .populate('customerId', 'name contactPerson phone email')
        .populate('assignedVehicleId', 'registrationNumber make model type')
        .populate('assignedDriverId', 'name phone licenseNumber')
        .populate('tripId', 'tripNumber status originCity destinationCity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Shipment.countDocuments(filter),
    ]);

    return {
      shipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getShipmentById(
    companyId: mongoose.Types.ObjectId,
    shipmentId: string
  ): Promise<IShipment> {
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      throw new AppError('Invalid shipment ID format', 400);
    }

    const shipment = await Shipment.findOne({
      _id: new mongoose.Types.ObjectId(shipmentId),
      companyId,
      isArchived: false,
    })
      .populate('customerId', 'name contactPerson phone email billingAddress')
      .populate('assignedVehicleId', 'registrationNumber make model type currentOdometer status')
      .populate('assignedDriverId', 'name phone licenseNumber')
      .populate('tripId', 'tripNumber status originCity destinationCity');

    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    return shipment as unknown as IShipment;
  }

  static async updateShipment(
    companyId: mongoose.Types.ObjectId,
    shipmentId: string,
    input: UpdateShipmentInput
  ): Promise<IShipment> {
    const shipment = await this.getShipmentById(companyId, shipmentId);

    if (input.customerId) {
      const customer = await Customer.findOne({
        _id: new mongoose.Types.ObjectId(input.customerId),
        companyId,
        isArchived: false,
      });
      if (!customer) {
        throw new AppError('Customer not found or does not belong to this company', 400);
      }
      shipment.customerId = customer._id as mongoose.Types.ObjectId;
    }

    if (input.assignedVehicleId !== undefined) {
      if (input.assignedVehicleId) {
        const vehicle = await Vehicle.findOne({
          _id: new mongoose.Types.ObjectId(input.assignedVehicleId),
          companyId,
          isArchived: false,
        });
        if (!vehicle) {
          throw new AppError('Vehicle not found or does not belong to this company', 400);
        }
        shipment.assignedVehicleId = vehicle._id as mongoose.Types.ObjectId;
      } else {
        shipment.assignedVehicleId = null;
      }
    }

    if (input.assignedDriverId !== undefined) {
      if (input.assignedDriverId) {
        const driver = await Driver.findOne({
          _id: new mongoose.Types.ObjectId(input.assignedDriverId),
          companyId,
          isArchived: false,
        });
        if (!driver) {
          throw new AppError('Driver not found or does not belong to this company', 400);
        }
        shipment.assignedDriverId = driver._id as mongoose.Types.ObjectId;
      } else {
        shipment.assignedDriverId = null;
      }
    }

    if (input.origin) {
      shipment.origin = {
        address: input.origin.address,
        city: input.origin.city,
        state: input.origin.state || undefined,
        pincode: input.origin.pincode || undefined,
        contactName: input.origin.contactName || undefined,
        contactPhone: input.origin.contactPhone || undefined,
      };
    }
    if (input.destination) {
      shipment.destination = {
        address: input.destination.address,
        city: input.destination.city,
        state: input.destination.state || undefined,
        pincode: input.destination.pincode || undefined,
        contactName: input.destination.contactName || undefined,
        contactPhone: input.destination.contactPhone || undefined,
      };
    }
    if (input.cargoDescription !== undefined) shipment.cargoDescription = input.cargoDescription;
    if (input.cargoCategory !== undefined) shipment.cargoCategory = input.cargoCategory;
    if (input.weightKg !== undefined) shipment.weightKg = input.weightKg;
    if (input.volumeCbm !== undefined) shipment.volumeCbm = input.volumeCbm || undefined;
    if (input.priority !== undefined) shipment.priority = input.priority;
    if (input.status !== undefined) shipment.status = input.status;
    if (input.estimatedCost !== undefined) shipment.estimatedCost = input.estimatedCost;
    if (input.agreedPrice !== undefined) shipment.agreedPrice = input.agreedPrice;
    if (input.pickupDate !== undefined) shipment.pickupDate = input.pickupDate ? new Date(input.pickupDate) : undefined;
    if (input.deliveryDate !== undefined) shipment.deliveryDate = input.deliveryDate ? new Date(input.deliveryDate) : undefined;
    if (input.specialInstructions !== undefined) shipment.specialInstructions = input.specialInstructions || undefined;
    if (input.notes !== undefined) shipment.notes = input.notes || undefined;

    await (shipment as any).save();

    return (await (shipment as any).populate([
      { path: 'customerId', select: 'name contactPerson phone email' },
      { path: 'assignedVehicleId', select: 'registrationNumber make model type' },
      { path: 'assignedDriverId', select: 'name phone licenseNumber' },
      { path: 'tripId', select: 'tripNumber status' },
    ])) as unknown as IShipment;
  }

  static async confirmDelivery(
    companyId: mongoose.Types.ObjectId,
    shipmentId: string,
    input: ConfirmDeliveryInput
  ): Promise<IShipment> {
    const shipment = await this.getShipmentById(companyId, shipmentId);

    if (shipment.status === 'DELIVERED') {
      throw new AppError('Shipment is already marked as delivered', 400);
    }

    const podNumber =
      input.podNumber?.trim().toUpperCase() ||
      `POD-${shipment.shipmentNumber}-${Date.now().toString().slice(-4)}`;

    shipment.status = 'DELIVERED';
    shipment.deliveryConfirmation = {
      deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : new Date(),
      recipientName: input.recipientName.trim(),
      recipientPhone: input.recipientPhone?.trim(),
      notes: input.notes?.trim(),
      podNumber,
    };

    await (shipment as any).save();

    return (await (shipment as any).populate([
      { path: 'customerId', select: 'name contactPerson phone email' },
      { path: 'assignedVehicleId', select: 'registrationNumber make model' },
      { path: 'assignedDriverId', select: 'name phone' },
    ])) as unknown as IShipment;
  }

  static async archiveShipment(
    companyId: mongoose.Types.ObjectId,
    shipmentId: string
  ): Promise<void> {
    const shipment = await this.getShipmentById(companyId, shipmentId);
    if (shipment.status === 'IN_TRANSIT') {
      throw new AppError('Cannot archive a shipment that is currently in transit', 400);
    }
    (shipment as any).isArchived = true;
    (shipment as any).status = 'CANCELLED';
    await (shipment as any).save();
  }
}
