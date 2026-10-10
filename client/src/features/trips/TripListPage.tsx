import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Navigation,
  Plus,
  Search,
  Play,
  CheckCircle2,
  XCircle,
  Eye,
  Truck,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { ITrip, TripStatus, IVehicle, IDriver, IShipment } from '../../types/index.js';
import { tripService } from '../../services/trip.service.js';
import { vehicleService } from '../../services/vehicle.service.js';
import { driverService } from '../../services/driver.service.js';
import { shipmentService } from '../../services/shipment.service.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils.js';

const CreateTripSchema = z.object({
  tripNumber: z.string().optional(),
  vehicleId: z.string().min(1, 'Please select a vehicle'),
  driverId: z.string().min(1, 'Please select a driver'),
  shipmentIds: z.array(z.string()).min(1, 'Please assign at least one shipment'),
  originCity: z.string().min(2, 'Origin city is required'),
  destinationCity: z.string().min(2, 'Destination city is required'),
  plannedDepartureDate: z.string().min(1, 'Planned departure date is required'),
  plannedArrivalDate: z.string().optional(),
  estimatedDistanceKm: z.number().positive('Estimated distance must be positive'),
  estimatedCost: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

type CreateTripFormData = z.infer<typeof CreateTripSchema>;

const CompleteTripSchema = z.object({
  endOdometer: z.number().positive('End odometer must be positive'),
  actualArrivalDate: z.string().optional(),
  fuelCost: z.number().nonnegative('Fuel cost must be non-negative'),
  tollCost: z.number().nonnegative('Toll cost must be non-negative'),
  driverAllowance: z.number().nonnegative('Driver allowance must be non-negative'),
  otherExpenses: z.number().nonnegative('Other expenses must be non-negative'),
  notes: z.string().optional(),
});

type CompleteTripFormData = z.infer<typeof CompleteTripSchema>;

export const TripListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [trips, setTrips] = useState<ITrip[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [pendingShipments, setPendingShipments] = useState<IShipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ITrip | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ITrip | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create Trip Form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    setValue: setCreateValue,
    watch: watchCreate,
    formState: { errors: createErrors, isSubmitting: isSubmittingCreate },
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(CreateTripSchema),
    defaultValues: {
      shipmentIds: [],
      estimatedDistanceKm: 100,
      estimatedCost: 0,
    },
  });

  const selectedShipmentIds = watchCreate('shipmentIds') || [];

  // Complete Trip Form
  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: completeErrors, isSubmitting: isSubmittingComplete },
  } = useForm<CompleteTripFormData>({
    resolver: zodResolver(CompleteTripSchema),
    defaultValues: {
      endOdometer: 0,
      fuelCost: 0,
      tollCost: 0,
      driverAllowance: 0,
      otherExpenses: 0,
    },
  });

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tripService.getTrips({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: (statusFilter as TripStatus) || undefined,
      });
      setTrips(res.trips || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err: any) {
      setFormError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const loadResources = async () => {
    try {
      const [vRes, dRes, sRes] = await Promise.all([
        vehicleService.getVehicles({ limit: 100, status: 'AVAILABLE' as any }),
        driverService.getDrivers({ limit: 100, status: 'AVAILABLE' as any }),
        shipmentService.getShipments({ limit: 100, status: 'PENDING' }),
      ]);
      setVehicles(vRes.vehicles || []);
      setDrivers(dRes.drivers || []);
      setPendingShipments(sRes.shipments || []);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    if (createModalOpen) {
      loadResources();
    }
  }, [createModalOpen]);

  const handleCreateTrip = async (data: CreateTripFormData) => {
    try {
      setFormError(null);
      await tripService.createTrip({
        tripNumber: data.tripNumber,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        shipmentIds: data.shipmentIds,
        originCity: data.originCity,
        destinationCity: data.destinationCity,
        plannedDepartureDate: data.plannedDepartureDate,
        plannedArrivalDate: data.plannedArrivalDate,
        estimatedDistanceKm: Number(data.estimatedDistanceKm),
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
        notes: data.notes,
      });

      setActionSuccess('Trip planned and dispatched successfully!');
      setCreateModalOpen(false);
      resetCreate();
      fetchTrips();
    } catch (err: any) {
      setFormError(err.message || 'Failed to dispatch trip');
    }
  };

  const handleStartTrip = async (trip: ITrip) => {
    try {
      setFormError(null);
      const vehicle = typeof trip.vehicleId === 'object' ? trip.vehicleId : null;
      const initialOdo = vehicle?.currentOdometer || 0;
      await tripService.startTrip(trip._id, { startOdometer: initialOdo });
      setActionSuccess(`Trip #${trip.tripNumber} started successfully!`);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.message || 'Failed to start trip');
    }
  };

  const openCompleteModal = (trip: ITrip) => {
    setSelectedTrip(trip);
    const startOdo = trip.startOdometer || 0;
    resetComplete({
      endOdometer: startOdo > 0 ? startOdo + Math.round(trip.estimatedDistanceKm || 100) : 0,
      actualArrivalDate: new Date().toISOString().split('T')[0],
      fuelCost: Math.round((trip.estimatedCost || 2000) * 0.6),
      tollCost: 350,
      driverAllowance: 500,
      otherExpenses: 0,
      notes: '',
    });
    setCompleteModalOpen(true);
  };

  const handleCompleteTrip = async (data: CompleteTripFormData) => {
    if (!selectedTrip) return;
    try {
      setFormError(null);
      const fuelCost = Number(data.fuelCost);
      const tollCost = Number(data.tollCost);
      const driverAllowance = Number(data.driverAllowance);
      const otherExpenses = Number(data.otherExpenses);
      const totalExpenses = fuelCost + tollCost + driverAllowance + otherExpenses;

      await tripService.completeTrip(selectedTrip._id, {
        endOdometer: Number(data.endOdometer),
        actualArrivalDate: data.actualArrivalDate,
        costBreakdown: {
          fuelCost,
          tollCost,
          driverAllowance,
          otherCost: otherExpenses,
        },
        actualCost: totalExpenses,
        notes: data.notes,
      });

      setActionSuccess(`Trip #${selectedTrip.tripNumber} completed successfully!`);
      setCompleteModalOpen(false);
      setSelectedTrip(null);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete trip');
    }
  };

  const handleCancelTrip = async () => {
    if (!cancelTarget) return;
    try {
      setFormError(null);
      await tripService.cancelTrip(cancelTarget._id, 'Cancelled by operator');
      setActionSuccess(`Trip #${cancelTarget.tripNumber} cancelled.`);
      setCancelTarget(null);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.message || 'Failed to cancel trip');
    }
  };

  const toggleShipmentSelection = (id: string) => {
    const current = selectedShipmentIds;
    if (current.includes(id)) {
      setCreateValue('shipmentIds', current.filter((sId) => sId !== id));
    } else {
      setCreateValue('shipmentIds', [...current, id]);
    }
  };

  const getStatusBadgeVariant = (status: TripStatus): 'secondary' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'PLANNED':
        return 'secondary';
      case 'ASSIGNED':
        return 'warning';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Trips & Dispatch' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trips & Dispatch Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Plan, assign, dispatch, and track trips across your fleet in real time.
          </p>
        </div>
        {!isViewer && (
          <Button
            onClick={() => {
              setFormError(null);
              resetCreate();
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Dispatch Trip
          </Button>
        )}
      </div>

      {actionSuccess && (
        <Alert variant="success">
          {actionSuccess}
        </Alert>
      )}

      {formError && (
        <Alert variant="error">
          {formError}
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by trip number, route..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div>
              <select
                aria-label="Filter by Trip Status"
                className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="PLANNED">Planned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={<Navigation className="w-12 h-12 text-slate-400" />}
              title="No Trips Found"
              description="Get started by dispatching your first trip."
              actionText={!isViewer ? "Dispatch First Trip" : undefined}
              onAction={!isViewer ? () => { resetCreate(); setCreateModalOpen(true); } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Trip #</th>
                    <th className="px-6 py-3 font-semibold">Route</th>
                    <th className="px-6 py-3 font-semibold">Vehicle & Driver</th>
                    <th className="px-6 py-3 font-semibold">Shipments</th>
                    <th className="px-6 py-3 font-semibold">Departure</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Financials</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {trips.map((trip) => {
                    const vehicle = typeof trip.vehicleId === 'object' ? trip.vehicleId : null;
                    const driver = typeof trip.driverId === 'object' ? trip.driverId : null;
                    const shipmentCount = trip.shipmentIds?.length || 0;

                    return (
                      <tr
                        key={trip._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-primary-500" />
                            <span>{trip.tripNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {trip.originCity} → {trip.destinationCity}
                          </div>
                          <div className="text-xs text-slate-500">
                            ~{trip.estimatedDistanceKm} km
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-900 dark:text-white font-medium">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{driver ? driver.name : 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">
                            {shipmentCount} {shipmentCount === 1 ? 'Shipment' : 'Shipments'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                          <div>Plan: {formatDate(trip.plannedDepartureDate)}</div>
                          {trip.actualDepartureDate && (
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Actual: {formatDateTime(trip.actualDepartureDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(trip.status)}>
                            {trip.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="text-slate-500">Est: </span>
                            <span className="font-medium">{formatCurrency(trip.estimatedCost || 0)}</span>
                          </div>
                          {trip.actualCost !== undefined && trip.actualCost > 0 && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>Act: </span>
                              <span>{formatCurrency(trip.actualCost)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTrip(trip);
                                setDetailsModalOpen(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>

                            {!isViewer && (trip.status === 'ASSIGNED' || trip.status === 'PLANNED') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartTrip(trip)}
                                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 text-xs flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Start
                              </Button>
                            )}

                            {!isViewer && trip.status === 'IN_PROGRESS' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCompleteModal(trip)}
                                className="text-primary-600 border-primary-300 hover:bg-primary-50 text-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Complete
                              </Button>
                            )}

                            {!isViewer && (trip.status === 'PLANNED' || trip.status === 'ASSIGNED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelTarget(trip)}
                                title="Cancel Trip"
                              >
                                <XCircle className="w-4 h-4 text-rose-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && trips.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {trips.length} of {total} trips
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DISPATCH / CREATE TRIP MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Dispatch & Plan New Trip"
      >
        <form onSubmit={handleSubmitCreate(handleCreateTrip)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Trip Number (Optional)
              </label>
              <Input
                placeholder="TRIP-YYYY-XXXX (Auto-generated if empty)"
                {...registerCreate('tripNumber')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Vehicle <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Select Vehicle"
                className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...registerCreate('vehicleId')}
              >
                <option value="">Select an available vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} — {v.make} {v.model} ({v.type})
                  </option>
                ))}
              </select>
              {createErrors.vehicleId && (
                <p className="text-xs text-rose-500 mt-1">{createErrors.vehicleId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Driver <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Select Driver"
                className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...registerCreate('driverId')}
              >
                <option value="">Select an available driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} (Lic: {d.licenseNumber})
                  </option>
                ))}
              </select>
              {createErrors.driverId && (
                <p className="text-xs text-rose-500 mt-1">{createErrors.driverId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Estimated Distance (KM) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 350"
                {...registerCreate('estimatedDistanceKm', { valueAsNumber: true })}
              />
              {createErrors.estimatedDistanceKm && (
                <p className="text-xs text-rose-500 mt-1">{createErrors.estimatedDistanceKm.message}</p>
              )}
            </div>
          </div>

          {/* Select Shipments */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Select Shipments for this Trip <span className="text-rose-500">*</span>
            </label>
            {pendingShipments.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded border border-amber-200">
                No pending shipments available to dispatch. Please create a shipment first!
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800">
                {pendingShipments.map((s) => {
                  const checked = selectedShipmentIds.includes(s._id);
                  return (
                    <div
                      key={s._id}
                      onClick={() => toggleShipmentSelection(s._id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        checked ? 'bg-primary-50/50 dark:bg-primary-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {s.shipmentNumber} — {s.cargoDescription}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {s.origin?.city} → {s.destination?.city} | {s.weightKg} kg
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">
                        {formatCurrency(s.agreedPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {createErrors.shipmentIds && (
              <p className="text-xs text-rose-500 mt-1">{createErrors.shipmentIds.message}</p>
            )}
          </div>

          {/* Origin and Destination City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Origin City <span className="text-rose-500">*</span>
              </label>
              <Input placeholder="e.g. Mumbai" {...registerCreate('originCity')} />
              {createErrors.originCity && (
                <p className="text-xs text-rose-500 mt-1">{createErrors.originCity.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Destination City <span className="text-rose-500">*</span>
              </label>
              <Input placeholder="e.g. Pune" {...registerCreate('destinationCity')} />
              {createErrors.destinationCity && (
                <p className="text-xs text-rose-500 mt-1">{createErrors.destinationCity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Planned Departure Date <span className="text-rose-500">*</span>
              </label>
              <Input type="date" {...registerCreate('plannedDepartureDate')} />
              {createErrors.plannedDepartureDate && (
                <p className="text-xs text-rose-500 mt-1">{createErrors.plannedDepartureDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Planned Arrival Date
              </label>
              <Input type="date" {...registerCreate('plannedArrivalDate')} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Estimated Trip Cost (INR)
            </label>
            <Input
              type="number"
              placeholder="e.g. 4500"
              {...registerCreate('estimatedCost', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Dispatch Notes / Instructions
            </label>
            <Input placeholder="Special route or checkpoint instructions" {...registerCreate('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingCreate}>
              {isSubmittingCreate ? 'Dispatching...' : 'Confirm Dispatch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE TRIP MODAL */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={`Complete Trip #${selectedTrip?.tripNumber || ''}`}
      >
        <form onSubmit={handleSubmitComplete(handleCompleteTrip)} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record final odometer and actual operational expenses incurred during this trip.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Final Odometer (KM) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 15450"
                {...registerComplete('endOdometer', { valueAsNumber: true })}
              />
              {completeErrors.endOdometer && (
                <p className="text-xs text-rose-500 mt-1">{completeErrors.endOdometer.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Actual Arrival Date
              </label>
              <Input type="date" {...registerComplete('actualArrivalDate')} />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Trip Cost Breakdown (INR)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Fuel Cost</label>
                <Input
                  type="number"
                  {...registerComplete('fuelCost', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Toll Charges</label>
                <Input
                  type="number"
                  {...registerComplete('tollCost', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Driver Allowance</label>
                <Input
                  type="number"
                  {...registerComplete('driverAllowance', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Other Expenses</label>
                <Input
                  type="number"
                  {...registerComplete('otherExpenses', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Trip Completion Notes
            </label>
            <Input placeholder="Safe delivery, no damages, route smooth..." {...registerComplete('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCompleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingComplete}>
              {isSubmittingComplete ? 'Completing...' : 'Finalize & Complete Trip'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* TRIP DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Trip Details #${selectedTrip?.tripNumber || ''}`}
      >
        {selectedTrip && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500">Route</span>
                <p className="font-bold text-lg text-slate-900 dark:text-white">
                  {selectedTrip.originCity} → {selectedTrip.destinationCity}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedTrip.status)}>
                {selectedTrip.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Estimated Distance</span>
                <p className="font-semibold">{selectedTrip.estimatedDistanceKm} KM</p>
              </div>
              <div>
                <span className="text-slate-500">Actual Distance</span>
                <p className="font-semibold">{selectedTrip.actualDistanceKm ? `${selectedTrip.actualDistanceKm} KM` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Departure</span>
                <p className="font-semibold">{formatDate(selectedTrip.plannedDepartureDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Arrival</span>
                <p className="font-semibold">{selectedTrip.actualArrivalDate ? formatDate(selectedTrip.actualArrivalDate) : 'Pending'}</p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Trip Financial Accounting
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Estimated Cost:</span>{' '}
                  <span className="font-semibold">{formatCurrency(selectedTrip.estimatedCost || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Actual Total Cost:</span>{' '}
                  <span className="font-semibold text-rose-600">
                    {formatCurrency(selectedTrip.actualCost || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Fuel Cost:</span>{' '}
                  <span className="font-medium">{formatCurrency(selectedTrip.costBreakdown?.fuelCost || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tolls & Passes:</span>{' '}
                  <span className="font-medium">{formatCurrency(selectedTrip.costBreakdown?.tollCost || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel Trip"
        message={`Are you sure you want to cancel Trip #${cancelTarget?.tripNumber}? Assigned shipments will be reset to pending status.`}
        confirmText="Yes, Cancel Trip"
        isDangerous={true}
        onConfirm={handleCancelTrip}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
};
