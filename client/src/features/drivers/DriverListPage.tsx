import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Phone,
  Mail,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Truck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IDriver, DriverStatus } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { driverService } from '../../services/driver.service.js';
import { vehicleService } from '../../services/vehicle.service.js';

const driverFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100).trim(),
  phone: z.string().min(7, 'Phone number required').max(20).trim(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  licenseNumber: z.string().min(3, 'License number required').max(30).trim(),
  licenseCategory: z.string().min(1, 'Category is required').max(50).trim(),
  licenseExpiryDate: z.string().min(1, 'Expiry date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
  assignedVehicleId: z.string().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

export const DriverListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Actions
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IDriver | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      status: 'ACTIVE',
      licenseCategory: 'HMV',
    },
  });

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverService.getDrivers({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setDrivers(data.drivers);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    vehicleService.getVehicles({ limit: 100 }).then((data) => {
      setVehicles(data.vehicles || []);
    }).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingDriver(null);
    setFormError(null);
    reset({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      licenseCategory: 'HMV',
      licenseExpiryDate: '',
      status: 'ACTIVE',
      assignedVehicleId: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      emergencyName: '',
      emergencyPhone: '',
      address: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (driver: IDriver) => {
    setEditingDriver(driver);
    setFormError(null);
    setValue('name', driver.name);
    setValue('phone', driver.phone);
    setValue('email', driver.email || '');
    setValue('licenseNumber', driver.licenseNumber);
    setValue('licenseCategory', driver.licenseCategory);
    setValue('licenseExpiryDate', driver.licenseExpiryDate ? driver.licenseExpiryDate.split('T')[0] : '');
    setValue('status', driver.status);
    setValue('assignedVehicleId', driver.assignedVehicleId?._id || '');
    setValue('dateOfJoining', driver.dateOfJoining ? driver.dateOfJoining.split('T')[0] : '');
    setValue('emergencyName', driver.emergencyContact?.name || '');
    setValue('emergencyPhone', driver.emergencyContact?.phone || '');
    setValue('address', driver.address || '');
    setValue('notes', driver.notes || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: DriverFormData) => {
    setFormError(null);
    try {
      const payload: any = {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiryDate: data.licenseExpiryDate,
        status: data.status,
        assignedVehicleId: data.assignedVehicleId || null,
        dateOfJoining: data.dateOfJoining || null,
        emergencyContact: data.emergencyName ? { name: data.emergencyName, phone: data.emergencyPhone || '' } : null,
        address: data.address || null,
        notes: data.notes || null,
      };

      if (editingDriver) {
        await driverService.updateDriver(editingDriver._id, payload);
        setActionSuccess(`Driver ${data.name} updated successfully.`);
      } else {
        await driverService.createDriver(payload);
        setActionSuccess(`Driver ${data.name} added successfully.`);
      }
      setModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await driverService.archiveDriver(archiveTarget._id);
      setActionSuccess(`Driver ${archiveTarget.name} archived.`);
      setArchiveTarget(null);
      fetchDrivers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive driver.');
    }
  };

  const isLicenseExpiringSoon = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isLicenseExpired = (dateStr: string) => {
    return new Date(dateStr).getTime() <= Date.now();
  };

  const getStatusBadge = (status: DriverStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="warning">On Leave</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Drivers' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Driver Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain driver rosters, licenses, vehicle assignments, and emergency contacts.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Driver
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
              <p className="text-xs font-medium text-slate-500">Total Drivers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {drivers.filter((d) => d.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">On Leave</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                {drivers.filter((d) => d.status === 'ON_LEAVE').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">License Alerts</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">
                {
                  drivers.filter(
                    (d) => isLicenseExpired(d.licenseExpiryDate) || isLicenseExpiringSoon(d.licenseExpiryDate)
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or license number..."
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
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading driver records...</div>
          ) : drivers.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="w-8 h-8 text-slate-400" />}
              title="No drivers found"
              description="Onboard transport drivers to assign fleet vehicles and track operations."
              actionText={!isViewer ? 'Add Driver' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Driver Name & Contact</th>
                    <th className="py-3 px-4">License Details</th>
                    <th className="py-3 px-4">License Expiry</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Vehicle</th>
                    {!isViewer && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {drivers.map((d) => {
                    const expired = isLicenseExpired(d.licenseExpiryDate);
                    const soon = isLicenseExpiringSoon(d.licenseExpiryDate);

                    return (
                      <tr key={d._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{d.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {d.phone}
                            </span>
                            {d.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {d.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {d.licenseNumber}
                          </span>
                          <span className="text-xs text-slate-400 block">{d.licenseCategory}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {new Date(d.licenseExpiryDate).toLocaleDateString()}
                            </span>
                            {expired && (
                              <Badge variant="danger" size="sm">
                                Expired
                              </Badge>
                            )}
                            {soon && (
                              <Badge variant="warning" size="sm">
                                Due Soon
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(d.status)}</td>
                        <td className="py-3.5 px-4">
                          {d.assignedVehicleId ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                              <Truck className="w-4 h-4 text-brand-500" />
                              <span>{d.assignedVehicleId.registrationNumber}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Vehicle</span>
                          )}
                        </td>
                        {!isViewer && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(d)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Driver"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setArchiveTarget(d)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Archive Driver"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Showing {drivers.length} of {total} drivers
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
        title={editingDriver ? `Edit Driver: ${editingDriver.name}` : 'Add Driver'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
              <Input {...register('name')} placeholder="e.g. Ramesh Singh" className="mt-1" error={errors.name?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
              <Input {...register('phone')} placeholder="+91 9876543210" className="mt-1" error={errors.phone?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <Input {...register('email')} type="email" placeholder="driver@company.com" className="mt-1" error={errors.email?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                {...register('status')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">License Number *</label>
              <Input {...register('licenseNumber')} placeholder="DL-1420110012345" className="mt-1 uppercase" error={errors.licenseNumber?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">License Category *</label>
              <Input {...register('licenseCategory')} placeholder="HMV / Heavy Transport" className="mt-1" error={errors.licenseCategory?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">License Expiry Date *</label>
              <Input {...register('licenseExpiryDate')} type="date" className="mt-1" error={errors.licenseExpiryDate?.message} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Vehicle</label>
            <select
              {...register('assignedVehicleId')}
              className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No Vehicle Assigned (Unassigned)</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber} ({v.make} {v.model}) - {v.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emergency Contact Name</label>
              <Input {...register('emergencyName')} placeholder="Contact Person" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emergency Contact Phone</label>
              <Input {...register('emergencyPhone')} placeholder="+91 ..." className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
            <Input {...register('address')} placeholder="City, State" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
            <Input {...register('notes')} placeholder="Optional driver background or badge number" className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingDriver ? 'Save Changes' : 'Create Driver'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Driver"
        message={`Are you sure you want to archive driver "${archiveTarget?.name}"? They will be unassigned from their vehicle and marked inactive.`}
        confirmText="Archive Driver"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
