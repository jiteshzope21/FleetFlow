import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Play,
  Calendar,
  Truck,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IMaintenance, MaintenanceType, MaintenanceStatus } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { maintenanceService } from '../../services/maintenance.service.js';
import { vehicleService } from '../../services/vehicle.service.js';

const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  serviceType: z.enum([
    'ROUTINE_SERVICE',
    'REPAIR',
    'INSPECTION',
    'TIRE_REPLACEMENT',
    'OIL_CHANGE',
    'BRAKE_SERVICE',
    'ACCIDENT_REPAIR',
    'OTHER',
  ]),
  description: z.string().min(2, 'Description required').max(500).trim(),
  serviceDate: z.string().min(1, 'Service date is required'),
  odometerAtService: z.coerce.number().min(0).optional().nullable(),
  serviceProvider: z.string().optional().nullable(),
  partsCost: z.coerce.number().min(0).default(0),
  laborCost: z.coerce.number().min(0).default(0),
  totalCost: z.coerce.number().min(0).optional().nullable(),
  nextServiceDate: z.string().optional().nullable(),
  nextServiceOdometer: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional().nullable(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

export const MaintenanceListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [records, setRecords] = useState<IMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IMaintenance | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IMaintenance | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      serviceType: 'ROUTINE_SERVICE',
      status: 'SCHEDULED',
      partsCost: 0,
      laborCost: 0,
    },
  });

  const watchedParts = watch('partsCost') || 0;
  const watchedLabor = watch('laborCost') || 0;

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await maintenanceService.getMaintenanceList({
        page,
        limit: 10,
        vehicleId: vehicleFilter || undefined,
        status: statusFilter || undefined,
        serviceType: typeFilter || undefined,
      });
      setRecords(data.records);
      setTotalCost(data.totalMaintenanceExpenditure);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load maintenance records:', err);
    } finally {
      setLoading(false);
    }
  }, [page, vehicleFilter, statusFilter, typeFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    vehicleService.getVehicles({ limit: 100 }).then((data) => {
      setVehicles(data.vehicles || []);
    }).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormError(null);
    reset({
      vehicleId: '',
      serviceType: 'ROUTINE_SERVICE',
      description: '',
      serviceDate: new Date().toISOString().split('T')[0],
      odometerAtService: 0,
      serviceProvider: '',
      partsCost: 0,
      laborCost: 0,
      totalCost: 0,
      nextServiceDate: '',
      nextServiceOdometer: 0,
      status: 'SCHEDULED',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (rec: IMaintenance) => {
    setEditingRecord(rec);
    setFormError(null);
    setValue('vehicleId', rec.vehicleId?._id || '');
    setValue('serviceType', rec.serviceType);
    setValue('description', rec.description);
    setValue('serviceDate', rec.serviceDate ? rec.serviceDate.split('T')[0] : '');
    setValue('odometerAtService', rec.odometerAtService || 0);
    setValue('serviceProvider', rec.serviceProvider || '');
    setValue('partsCost', rec.partsCost);
    setValue('laborCost', rec.laborCost);
    setValue('totalCost', rec.totalCost);
    setValue('nextServiceDate', rec.nextServiceDate ? rec.nextServiceDate.split('T')[0] : '');
    setValue('nextServiceOdometer', rec.nextServiceOdometer || 0);
    setValue('status', rec.status);
    setValue('notes', rec.notes || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    setFormError(null);
    try {
      const parts = Number(data.partsCost) || 0;
      const labor = Number(data.laborCost) || 0;
      const computedTotal = data.totalCost !== undefined && data.totalCost !== null && data.totalCost > 0
        ? Number(data.totalCost)
        : parts + labor;

      const payload: any = {
        vehicleId: data.vehicleId,
        serviceType: data.serviceType,
        description: data.description,
        serviceDate: data.serviceDate,
        odometerAtService: data.odometerAtService || null,
        serviceProvider: data.serviceProvider || null,
        partsCost: parts,
        laborCost: labor,
        totalCost: computedTotal,
        nextServiceDate: data.nextServiceDate || null,
        nextServiceOdometer: data.nextServiceOdometer || null,
        status: data.status,
        notes: data.notes || null,
      };

      if (editingRecord) {
        await maintenanceService.updateMaintenance(editingRecord._id, payload);
        setActionSuccess('Maintenance record updated successfully.');
      } else {
        await maintenanceService.createMaintenance(payload);
        setActionSuccess('Maintenance service logged successfully.');
      }
      setModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleStatusQuickChange = async (rec: IMaintenance, newStatus: MaintenanceStatus) => {
    try {
      await maintenanceService.updateMaintenance(rec._id, { status: newStatus });
      setActionSuccess(`Maintenance status changed to ${newStatus}.`);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await maintenanceService.archiveMaintenance(archiveTarget._id);
      setActionSuccess('Maintenance record archived.');
      setArchiveTarget(null);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive record.');
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="warning">Scheduled</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Vehicle Maintenance' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Vehicle Maintenance & Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track repairs, preventive services, workshop costs, and vehicle uptime.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Service
          </Button>
        )}
      </div>

      {actionSuccess && (
        <Alert variant="success">
          {actionSuccess}
        </Alert>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Service Logs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">In Workshop</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                {records.filter((r) => r.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Scheduled</p>
              <p className="text-2xl font-bold text-sky-600 mt-0.5">
                {records.filter((r) => r.status === 'SCHEDULED').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                ₹{totalCost.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <select
                value={vehicleFilter}
                onChange={(e) => {
                  setVehicleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
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
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
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
                <option value="">All Service Types</option>
                <option value="ROUTINE_SERVICE">Routine Service</option>
                <option value="OIL_CHANGE">Oil Change</option>
                <option value="TIRE_REPLACEMENT">Tire Replacement</option>
                <option value="BRAKE_SERVICE">Brake Service</option>
                <option value="REPAIR">Repair</option>
                <option value="INSPECTION">Inspection</option>
                <option value="ACCIDENT_REPAIR">Accident Repair</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading maintenance records...</div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-8 h-8 text-slate-400" />}
              title="No maintenance records found"
              description="Keep your fleet in peak condition by logging routine services and repairs."
              actionText={!isViewer ? 'Log Service' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Service Type & Notes</th>
                    <th className="py-3 px-4">Service Date</th>
                    <th className="py-3 px-4">Workshop</th>
                    <th className="py-3 px-4">Total Cost</th>
                    <th className="py-3 px-4">Status</th>
                    {!isViewer && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-brand-500" />
                          {r.vehicleId?.registrationNumber || 'Unknown Vehicle'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {r.vehicleId?.make} {r.vehicleId?.model}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.serviceType.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {new Date(r.serviceDate).toLocaleDateString()}
                        {r.odometerAtService ? (
                          <span className="text-[11px] text-slate-400 block">
                            @{r.odometerAtService.toLocaleString()} km
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {r.serviceProvider || <span className="text-slate-400 italic">In-house</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{r.totalCost.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Parts: ₹{r.partsCost} | Labor: ₹{r.laborCost}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(r.status)}
                          {!isViewer && r.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleStatusQuickChange(r, 'IN_PROGRESS')}
                              className="text-xs font-bold text-brand-600 hover:underline"
                              title="Send to Workshop"
                            >
                              Start
                            </button>
                          )}
                          {!isViewer && r.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleStatusQuickChange(r, 'COMPLETED')}
                              className="text-xs font-bold text-emerald-600 hover:underline"
                              title="Mark Complete"
                            >
                              Finish
                            </button>
                          )}
                        </div>
                      </td>
                      {!isViewer && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(r)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setArchiveTarget(r)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Archive Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Showing {records.length} of {total} maintenance records
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecord ? 'Edit Maintenance Record' : 'Log Vehicle Maintenance'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Vehicle *</label>
              <select
                {...register('vehicleId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.make} {v.model}) - {v.currentOdometer.toLocaleString()} km
                  </option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-xs text-rose-500 mt-1">{errors.vehicleId.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service Category</label>
              <select
                {...register('serviceType')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ROUTINE_SERVICE">Routine Periodic Service</option>
                <option value="OIL_CHANGE">Oil & Filter Change</option>
                <option value="TIRE_REPLACEMENT">Tire Replacement & Alignment</option>
                <option value="BRAKE_SERVICE">Brake Pads & Hydraulics</option>
                <option value="REPAIR">Mechanical / Electrical Repair</option>
                <option value="INSPECTION">Safety / Fitness Inspection</option>
                <option value="ACCIDENT_REPAIR">Accident / Body Repair</option>
                <option value="OTHER">Other Miscellaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service Description *</label>
            <Input
              {...register('description')}
              placeholder="e.g. Engine oil replacement, fuel filter change, air filter cleaning"
              className="mt-1"
              error={errors.description?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service Date *</label>
              <Input {...register('serviceDate')} type="date" className="mt-1" error={errors.serviceDate?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Odometer at Service</label>
              <Input {...register('odometerAtService')} type="number" placeholder="km" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Workshop / Vendor</label>
              <Input {...register('serviceProvider')} placeholder="e.g. Authorized Tata Service Center" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Parts Cost (₹)</label>
              <Input {...register('partsCost')} type="number" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Labor Cost (₹)</label>
              <Input {...register('laborCost')} type="number" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Cost (₹) <span className="text-slate-400 font-normal">(Auto: {Number(watchedParts) + Number(watchedLabor)})</span>
              </label>
              <Input {...register('totalCost')} type="number" className="mt-1" placeholder="Calculated automatically" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                {...register('status')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress (Vehicle in workshop)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Next Service Due Date</label>
              <Input {...register('nextServiceDate')} type="date" className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Remarks / Invoice Notes</label>
            <Input {...register('notes')} placeholder="Optional invoice # or mechanic recommendations" className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingRecord ? 'Save Changes' : 'Log Maintenance'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Maintenance Record"
        message="Are you sure you want to archive this maintenance log?"
        confirmText="Archive"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
