import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Fuel,
  Plus,
  Search,
  Edit2,
  Trash2,
  Truck,
  UserCheck,
  Gauge,
  Calendar,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Droplet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IFuelLog, FuelType } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { fuelService } from '../../services/fuel.service.js';
import { vehicleService } from '../../services/vehicle.service.js';
import { driverService } from '../../services/driver.service.js';

const fuelFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional().nullable(),
  refuelingDate: z.string().min(1, 'Date is required'),
  fuelType: z.enum(['DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'HYBRID', 'LNG']),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  pricePerUnit: z.coerce.number().min(0).optional().nullable(),
  totalCost: z.coerce.number().min(0).optional().nullable(),
  odometer: z.coerce.number().min(0, 'Odometer cannot be negative'),
  fuelStation: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FuelFormData = z.infer<typeof fuelFormSchema>;

export const FuelListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [logs, setLogs] = useState<IFuelLog[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Summary Metrics
  const [totalFuelCost, setTotalFuelCost] = useState(0);
  const [totalFuelQuantity, setTotalFuelQuantity] = useState(0);
  const [avgCostPerLiter, setAvgCostPerLiter] = useState(0);

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<IFuelLog | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IFuelLog | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FuelFormData>({
    resolver: zodResolver(fuelFormSchema),
    defaultValues: {
      fuelType: 'DIESEL',
      quantity: 100,
      pricePerUnit: 92.5,
      totalCost: 9250,
    },
  });

  const watchedQty = watch('quantity') || 0;
  const watchedPrice = watch('pricePerUnit') || 0;

  const fetchFuelLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fuelService.getFuelLogs({
        page,
        limit: 10,
        vehicleId: vehicleFilter || undefined,
        fuelType: fuelTypeFilter || undefined,
      });
      setLogs(data.logs);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setTotalFuelCost(data.summary.totalFuelCost);
      setTotalFuelQuantity(data.summary.totalFuelQuantity);
      setAvgCostPerLiter(data.summary.avgCostPerLiter);
    } catch (err: any) {
      console.error('Failed to load fuel logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, vehicleFilter, fuelTypeFilter]);

  useEffect(() => {
    fetchFuelLogs();
  }, [fetchFuelLogs]);

  useEffect(() => {
    vehicleService.getVehicles({ limit: 100 }).then((data) => {
      setVehicles(data.vehicles || []);
    }).catch(() => {});

    driverService.getDrivers({ limit: 100 }).then((data) => {
      setDrivers(data.drivers || []);
    }).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingLog(null);
    setFormError(null);
    reset({
      vehicleId: '',
      driverId: '',
      refuelingDate: new Date().toISOString().split('T')[0],
      fuelType: 'DIESEL',
      quantity: 100,
      pricePerUnit: 92.5,
      totalCost: 9250,
      odometer: 0,
      fuelStation: '',
      invoiceNumber: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (log: IFuelLog) => {
    setEditingLog(log);
    setFormError(null);
    setValue('vehicleId', log.vehicleId?._id || '');
    setValue('driverId', log.driverId?._id || '');
    setValue('refuelingDate', log.refuelingDate ? log.refuelingDate.split('T')[0] : '');
    setValue('fuelType', log.fuelType);
    setValue('quantity', log.quantity);
    setValue('pricePerUnit', log.pricePerUnit || 0);
    setValue('totalCost', log.totalCost);
    setValue('odometer', log.odometer);
    setValue('fuelStation', log.fuelStation || '');
    setValue('invoiceNumber', log.invoiceNumber || '');
    setValue('notes', log.notes || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: FuelFormData) => {
    setFormError(null);
    try {
      const qty = Number(data.quantity);
      const price = Number(data.pricePerUnit) || 0;
      const computedTotal = data.totalCost !== undefined && data.totalCost !== null && data.totalCost > 0
        ? Number(data.totalCost)
        : Number((qty * price).toFixed(2));

      const payload: any = {
        vehicleId: data.vehicleId,
        driverId: data.driverId || null,
        refuelingDate: data.refuelingDate,
        fuelType: data.fuelType,
        quantity: qty,
        pricePerUnit: price,
        totalCost: computedTotal,
        odometer: Number(data.odometer),
        fuelStation: data.fuelStation || null,
        invoiceNumber: data.invoiceNumber || null,
        notes: data.notes || null,
      };

      if (editingLog) {
        await fuelService.updateFuelLog(editingLog._id, payload);
        setActionSuccess('Fuel log record updated.');
      } else {
        await fuelService.createFuelLog(payload);
        setActionSuccess('Fuel refill logged successfully.');
      }
      setModalOpen(false);
      fetchFuelLogs();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await fuelService.archiveFuelLog(archiveTarget._id);
      setActionSuccess('Fuel log record archived.');
      setArchiveTarget(null);
      fetchFuelLogs();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive record.');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Fuel Management' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Fuel className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Fuel Management & Consumption
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log fuel refills, track expenditure, vendor outlets, and fleet fuel economy.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Refueling
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
              <p className="text-xs font-medium text-slate-500">Refill Entries</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Fuel Spend</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">₹{totalFuelCost.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Volume</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalFuelQuantity.toLocaleString()} L</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Droplet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Avg Cost / Liter</p>
              <p className="text-2xl font-bold text-sky-600 mt-0.5">₹{avgCostPerLiter.toFixed(2)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                value={fuelTypeFilter}
                onChange={(e) => {
                  setFuelTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Fuel Types</option>
                <option value="DIESEL">Diesel</option>
                <option value="PETROL">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="LNG">LNG</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading fuel records...</div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<Fuel className="w-8 h-8 text-slate-400" />}
              title="No fuel logs found"
              description="Record fuel purchases to track fuel consumption and cost per kilometer."
              actionText={!isViewer ? 'Log Refueling' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Volume (L)</th>
                    <th className="py-3 px-4">Rate (₹/L)</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Odometer</th>
                    <th className="py-3 px-4">Fuel Station</th>
                    {!isViewer && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {new Date(l.refuelingDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-brand-500" />
                          {l.vehicleId?.registrationNumber || 'Vehicle'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {l.driverId?.name || <span className="text-slate-400 italic">Self / Other</span>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {l.quantity} L
                        <span className="text-[10px] text-slate-400 block font-normal">{l.fuelType}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {l.pricePerUnit ? `₹${l.pricePerUnit}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                        ₹{l.totalCost.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                        {l.odometer.toLocaleString()} km
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {l.fuelStation || <span className="italic">—</span>}
                      </td>
                      {!isViewer && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(l)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setArchiveTarget(l)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Archive Entry"
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
                Showing {logs.length} of {total} fuel records
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
        title={editingLog ? 'Edit Fuel Entry' : 'Log Refueling'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vehicle *</label>
              <select
                {...register('vehicleId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.make} {v.model}) - {v.currentOdometer} km
                  </option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-xs text-rose-500 mt-1">{errors.vehicleId.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Driver (Optional)</label>
              <select
                {...register('driverId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select driver...</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Refueling Date *</label>
              <Input {...register('refuelingDate')} type="date" className="mt-1" error={errors.refuelingDate?.message} />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity (Liters) *</label>
              <Input {...register('quantity')} type="number" step="0.1" className="mt-1" error={errors.quantity?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rate (₹ / Liter)</label>
              <Input {...register('pricePerUnit')} type="number" step="0.01" className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Cost (₹) <span className="text-slate-400 font-normal">(Auto: {Number((watchedQty * watchedPrice).toFixed(2))})</span>
              </label>
              <Input {...register('totalCost')} type="number" step="0.01" className="mt-1" placeholder="Calculated" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Odometer Reading (km) *</label>
              <Input {...register('odometer')} type="number" className="mt-1" error={errors.odometer?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fuel Station / Vendor</label>
              <Input {...register('fuelStation')} placeholder="e.g. Indian Oil, Bharat Petroleum" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice / Receipt #</label>
              <Input {...register('invoiceNumber')} placeholder="Bill # or fuel slip" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
              <Input {...register('notes')} placeholder="Optional comments" className="mt-1" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingLog ? 'Save Changes' : 'Log Refueling'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Fuel Entry"
        message="Are you sure you want to archive this fuel entry?"
        confirmText="Archive"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
