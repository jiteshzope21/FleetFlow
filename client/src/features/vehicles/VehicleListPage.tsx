import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Gauge,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IVehicle, VehicleType, FuelType, VehicleStatus } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { vehicleService } from '../../services/vehicle.service.js';
import { driverService } from '../../services/driver.service.js';

const vehicleFormSchema = z.object({
  registrationNumber: z.string().min(2, 'Registration number required').max(20).trim(),
  type: z.enum(['TRUCK', 'TRAILER', 'VAN', 'TANKER', 'CONTAINER', 'OTHER']),
  make: z.string().min(1, 'Make is required').max(50).trim(),
  model: z.string().min(1, 'Model is required').max(50).trim(),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 2),
  fuelType: z.enum(['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'HYBRID', 'LNG']),
  currentOdometer: z.coerce.number().min(0),
  status: z.enum(['ACTIVE', 'IN_MAINTENANCE', 'INACTIVE']),
  assignedDriverId: z.string().optional().nullable(),
  insuranceExpiryDate: z.string().optional().nullable(),
  registrationExpiryDate: z.string().optional().nullable(),
  pollutionExpiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

export const VehicleListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals & Actions
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<IVehicle | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IVehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      type: 'TRUCK',
      fuelType: 'DIESEL',
      status: 'ACTIVE',
      year: new Date().getFullYear(),
      currentOdometer: 0,
    },
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setVehicles(data.vehicles);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Load available drivers for dropdown
  useEffect(() => {
    driverService.getDrivers({ limit: 100 }).then((data) => {
      setDrivers(data.drivers || []);
    }).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormError(null);
    reset({
      registrationNumber: '',
      type: 'TRUCK',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      fuelType: 'DIESEL',
      currentOdometer: 0,
      status: 'ACTIVE',
      assignedDriverId: '',
      insuranceExpiryDate: '',
      registrationExpiryDate: '',
      pollutionExpiryDate: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (vehicle: IVehicle) => {
    setEditingVehicle(vehicle);
    setFormError(null);
    setValue('registrationNumber', vehicle.registrationNumber);
    setValue('type', vehicle.type);
    setValue('make', vehicle.make);
    setValue('model', vehicle.model);
    setValue('year', vehicle.year);
    setValue('fuelType', vehicle.fuelType);
    setValue('currentOdometer', vehicle.currentOdometer);
    setValue('status', vehicle.status);
    setValue('assignedDriverId', vehicle.assignedDriverId?._id || '');
    setValue('insuranceExpiryDate', vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.split('T')[0] : '');
    setValue('registrationExpiryDate', vehicle.registrationExpiryDate ? vehicle.registrationExpiryDate.split('T')[0] : '');
    setValue('pollutionExpiryDate', vehicle.pollutionExpiryDate ? vehicle.pollutionExpiryDate.split('T')[0] : '');
    setValue('notes', vehicle.notes || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: VehicleFormData) => {
    setFormError(null);
    try {
      const payload = {
        ...data,
        assignedDriverId: data.assignedDriverId || null,
        insuranceExpiryDate: data.insuranceExpiryDate || null,
        registrationExpiryDate: data.registrationExpiryDate || null,
        pollutionExpiryDate: data.pollutionExpiryDate || null,
      };

      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle._id, payload as any);
        setActionSuccess(`Vehicle ${data.registrationNumber} updated successfully.`);
      } else {
        await vehicleService.createVehicle(payload as any);
        setActionSuccess(`Vehicle ${data.registrationNumber} added to fleet.`);
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await vehicleService.archiveVehicle(archiveTarget._id);
      setActionSuccess(`Vehicle ${archiveTarget.registrationNumber} archived.`);
      setArchiveTarget(null);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive vehicle.');
    }
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'IN_MAINTENANCE':
        return <Badge variant="warning">In Maintenance</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() <= Date.now();
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Fleet & Vehicles' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Fleet & Vehicle Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track vehicles, odometers, document compliances, and driver assignments.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {actionSuccess && (
        <Alert variant="success">
          {actionSuccess}
        </Alert>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Fleet</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {vehicles.filter((v) => v.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">In Maintenance</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                {vehicles.filter((v) => v.status === 'IN_MAINTENANCE').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Compliance Alerts</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">
                {
                  vehicles.filter(
                    (v) =>
                      isExpiringSoon(v.insuranceExpiryDate) ||
                      isExpired(v.insuranceExpiryDate) ||
                      isExpiringSoon(v.pollutionExpiryDate) ||
                      isExpired(v.pollutionExpiryDate)
                  ).length
                }
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by registration number, make, or model..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_MAINTENANCE">In Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Vehicle Types</option>
                <option value="TRUCK">Truck</option>
                <option value="TRAILER">Trailer</option>
                <option value="VAN">Van</option>
                <option value="TANKER">Tanker</option>
                <option value="CONTAINER">Container</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading fleet records...</div>
          ) : vehicles.length === 0 ? (
            <EmptyState
              icon={<Truck className="w-8 h-8 text-slate-400" />}
              title="No vehicles found"
              description="Get started by adding your first transport vehicle to FleetFlow."
              actionText={!isViewer ? 'Add Vehicle' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Vehicle / Reg No</th>
                    <th className="py-3 px-4">Type & Fuel</th>
                    <th className="py-3 px-4">Odometer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Driver</th>
                    <th className="py-3 px-4">Compliance Warnings</th>
                    {!isViewer && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {vehicles.map((v) => {
                    const insExp = isExpired(v.insuranceExpiryDate);
                    const insSoon = isExpiringSoon(v.insuranceExpiryDate);
                    const polExp = isExpired(v.pollutionExpiryDate);
                    const polSoon = isExpiringSoon(v.pollutionExpiryDate);

                    return (
                      <tr key={v._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white tracking-wide">
                            {v.registrationNumber}
                          </div>
                          <div className="text-xs text-slate-500">
                            {v.make} {v.model} ({v.year})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{v.type}</span>
                          <span className="text-xs text-slate-400 block">{v.fuelType}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                            <Gauge className="w-4 h-4 text-slate-400" />
                            {v.currentOdometer.toLocaleString()} km
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(v.status)}</td>
                        <td className="py-3.5 px-4">
                          {v.assignedDriverId ? (
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {v.assignedDriverId.name}
                              </p>
                              <p className="text-xs text-slate-400">{v.assignedDriverId.phone}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {insExp && (
                              <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Insurance Expired
                              </span>
                            )}
                            {insSoon && (
                              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Insurance due soon
                              </span>
                            )}
                            {polExp && (
                              <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Pollution Expired
                              </span>
                            )}
                            {polSoon && (
                              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Pollution due soon
                              </span>
                            )}
                            {!insExp && !insSoon && !polExp && !polSoon && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                              </span>
                            )}
                          </div>
                        </td>
                        {!isViewer && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(v)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Vehicle"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setArchiveTarget(v)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Archive Vehicle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Showing {vehicles.length} of {total} vehicles
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-xs font-semibold px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? `Edit Vehicle: ${editingVehicle.registrationNumber}` : 'Add New Vehicle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Registration Number *
              </label>
              <Input
                {...register('registrationNumber')}
                placeholder="e.g. MH12AB1234"
                className="mt-1 uppercase"
                error={errors.registrationNumber?.message}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vehicle Type</label>
              <select
                {...register('type')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="TRUCK">Truck</option>
                <option value="TRAILER">Trailer</option>
                <option value="VAN">Van</option>
                <option value="TANKER">Tanker</option>
                <option value="CONTAINER">Container</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Make / Brand *</label>
              <Input {...register('make')} placeholder="e.g. Tata Motors, Volvo" className="mt-1" error={errors.make?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Model *</label>
              <Input {...register('model')} placeholder="e.g. Prima 5530.S" className="mt-1" error={errors.model?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Manufacturing Year *</label>
              <Input {...register('year')} type="number" className="mt-1" error={errors.year?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fuel Type</label>
              <select
                {...register('fuelType')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="DIESEL">Diesel</option>
                <option value="PETROL">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="LNG">LNG</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Odometer (km)</label>
              <Input {...register('currentOdometer')} type="number" className="mt-1" error={errors.currentOdometer?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operational Status</label>
              <select
                {...register('status')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="IN_MAINTENANCE">In Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Driver</label>
            <select
              {...register('assignedDriverId')}
              className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No Driver Assigned (Unassigned)</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.phone}) - {d.licenseNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Insurance Expiry</label>
              <Input {...register('insuranceExpiryDate')} type="date" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registration Expiry</label>
              <Input {...register('registrationExpiryDate')} type="date" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pollution Expiry (PUC)</label>
              <Input {...register('pollutionExpiryDate')} type="date" className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes / Telematics ID</label>
            <Input {...register('notes')} placeholder="Optional notes or asset tags" className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingVehicle ? 'Save Changes' : 'Create Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Archival */}
      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Vehicle"
        message={`Are you sure you want to archive vehicle "${archiveTarget?.registrationNumber}"? It will be marked inactive and removed from active operations.`}
        confirmText="Archive Vehicle"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
