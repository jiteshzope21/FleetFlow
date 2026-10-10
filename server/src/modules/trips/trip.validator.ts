import { z } from 'zod';
import { TRIP_STATUSES, STOP_TYPES } from '../../models/Trip.js';

const StopSchema = z.object({
  stopNumber: z.number().int().positive(),
  locationName: z.string().min(2),
  address: z.string().optional().nullable(),
  city: z.string().min(2),
  type: z.enum(STOP_TYPES).default('WAYPOINT'),
  plannedTime: z.string().datetime().optional().nullable(),
  actualTime: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const CostBreakdownSchema = z.object({
  fuelCost: z.number().nonnegative().optional(),
  tollCost: z.number().nonnegative().optional(),
  driverAllowance: z.number().nonnegative().optional(),
  maintenanceCost: z.number().nonnegative().optional(),
  otherCost: z.number().nonnegative().optional(),
});

export const CreateTripSchema = z.object({
  tripNumber: z.string().min(3).max(30).optional(),
  vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID'),
  driverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID'),
  shipmentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shipment ID')).optional().default([]),
  originCity: z.string().min(2, 'Origin city is required'),
  destinationCity: z.string().min(2, 'Destination city is required'),
  stops: z.array(StopSchema).optional(),
  plannedDepartureDate: z.string().datetime(),
  plannedArrivalDate: z.string().datetime(),
  estimatedDistanceKm: z.number().positive('Estimated distance must be positive'),
  estimatedCost: z.number().nonnegative().default(0),
  costBreakdown: CostBreakdownSchema.optional(),
  notes: z.string().optional().nullable(),
});

export const UpdateTripSchema = CreateTripSchema.partial().extend({
  status: z.enum(TRIP_STATUSES).optional(),
  actualDepartureDate: z.string().datetime().optional().nullable(),
  actualArrivalDate: z.string().datetime().optional().nullable(),
  startOdometer: z.number().nonnegative().optional().nullable(),
  endOdometer: z.number().nonnegative().optional().nullable(),
  actualDistanceKm: z.number().nonnegative().optional().nullable(),
  actualCost: z.number().nonnegative().optional().nullable(),
});

export const StartTripSchema = z.object({
  startOdometer: z.number().nonnegative().optional(),
  actualDepartureDate: z.string().datetime().optional(),
});

export const CompleteTripSchema = z.object({
  endOdometer: z.number().nonnegative().optional(),
  actualArrivalDate: z.string().datetime().optional(),
  costBreakdown: CostBreakdownSchema.optional(),
  actualCost: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

export const QueryTripSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  status: z.enum(TRIP_STATUSES).optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
export type StartTripInput = z.infer<typeof StartTripSchema>;
export type CompleteTripInput = z.infer<typeof CompleteTripSchema>;
export type QueryTripInput = z.infer<typeof QueryTripSchema>;
