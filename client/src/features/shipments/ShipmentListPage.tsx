import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IShipment, ShipmentStatus, CargoCategory, ShipmentPriority } from '../../types/index.js';
import { shipmentService } from '../../services/shipment.service.js';
import { customerService } from '../../services/customer.service.js';
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

const ShipmentFormSchema = z.object({
  shipmentNumber: z.string().optional(),
  customerId: z.string().min(1, 'Please select a customer'),
  originAddress: z.string().min(2, 'Origin address is required'),
  originCity: z.string().min(2, 'Origin city is required'),
  originState: z.string().optional(),
  originContactName: z.string().optional(),
  originContactPhone: z.string().optional(),
  destinationAddress: z.string().min(2, 'Destination address is required'),
  destinationCity: z.string().min(2, 'Destination city is required'),
  destinationState: z.string().optional(),
  destinationContactName: z.string().optional(),
  destinationContactPhone: z.string().optional(),
  cargoDescription: z.string().min(2, 'Cargo description is required'),
  cargoCategory: z.enum(['GENERAL', 'FRAGILE', 'PERISHABLE', 'HAZARDOUS', 'LIQUID', 'HEAVY_MACHINERY', 'PARCEL', 'OTHER']),
  weightKg: z.number().positive('Weight must be greater than 0'),
  priority: z.enum(['STANDARD', 'HIGH', 'URGENT']),
  agreedPrice: z.number().nonnegative('Agreed price must be non-negative'),
  estimatedCost: z.number().nonnegative().optional(),
  pickupDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof ShipmentFormSchema>;

const PodFormSchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientPhone: z.string().optional(),
  podNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PodFormData = z.infer<typeof PodFormSchema>;

export const ShipmentListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals & States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<IShipment | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IShipment | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(ShipmentFormSchema),
    defaultValues: {
      cargoCategory: 'GENERAL',
      priority: 'STANDARD',
      agreedPrice: 0,
      weightKg: 100,
    },
  });

  const {
    register: registerPod,
    handleSubmit: handlePodSubmit,
    reset: resetPod,
    formState: { errors: podErrors, isSubmitting: isPodSubmitting },
  } = useForm<PodFormData>({
    resolver: zodResolver(PodFormSchema),
  });

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getShipments({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setShipments(data.shipments || []);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    customerService.getCustomers({ limit: 100 }).then((data) => {
      setCustomers(data.customers || []);
    }).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setFormError(null);
    reset({
      shipmentNumber: '',
      cargoDescription: '',
      cargoCategory: 'GENERAL',
      weightKg: 500,
      priority: 'STANDARD',
      agreedPrice: 15000,
      estimatedCost: 9500,
      originCity: '',
      originAddress: '',
      destinationCity: '',
      destinationAddress: '',
    });
    setCreateModalOpen(true);
  };

  const onSubmitShipment = async (values: ShipmentFormData) => {
    try {
      setFormError(null);
      await shipmentService.createShipment({
        shipmentNumber: values.shipmentNumber || undefined,
        customerId: values.customerId,
        cargoDescription: values.cargoDescription,
        cargoCategory: values.cargoCategory,
        weightKg: Number(values.weightKg),
        priority: values.priority,
        agreedPrice: Number(values.agreedPrice),
        estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0,
        origin: {
          address: values.originAddress,
          city: values.originCity,
          state: values.originState || undefined,
          contactName: values.originContactName || undefined,
          contactPhone: values.originContactPhone || undefined,
        },
        destination: {
          address: values.destinationAddress,
          city: values.destinationCity,
          state: values.destinationState || undefined,
          contactName: values.destinationContactName || undefined,
          contactPhone: values.destinationContactPhone || undefined,
        },
        pickupDate: values.pickupDate ? new Date(values.pickupDate).toISOString() : undefined,
        deliveryDate: values.deliveryDate ? new Date(values.deliveryDate).toISOString() : undefined,
        specialInstructions: values.specialInstructions || undefined,
      });

      setCreateModalOpen(false);
      setActionSuccess('Shipment order created successfully.');
      fetchShipments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create shipment order.');
    }
  };

  const openPodModal = (shipment: IShipment) => {
    setSelectedShipment(shipment);
    resetPod({
      recipientName: '',
      recipientPhone: '',
      podNumber: `POD-${shipment.shipmentNumber}`,
      notes: '',
    });
    setPodModalOpen(true);
  };

  const onSubmitPod = async (values: PodFormData) => {
    if (!selectedShipment) return;
    try {
      await shipmentService.confirmDelivery(selectedShipment._id, {
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone || undefined,
        podNumber: values.podNumber || undefined,
        notes: values.notes || undefined,
      });
      setPodModalOpen(false);
      setActionSuccess(`Proof of Delivery recorded for ${selectedShipment.shipmentNumber}.`);
      fetchShipments();
    } catch (err: any) {
      alert(err.message || 'Failed to record Proof of Delivery.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await shipmentService.archiveShipment(archiveTarget._id);
      setArchiveTarget(null);
      setActionSuccess(`Shipment "${archiveTarget.shipmentNumber}" archived.`);
      fetchShipments();
    } catch (err: any) {
      alert(err.message || 'Failed to archive shipment.');
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="primary">In Transit</Badge>;
      case 'ASSIGNED':
        return <Badge variant="secondary">Assigned</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: ShipmentPriority) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Standard</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Shipments & Orders' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-brand-600" />
            <span>Shipments & Cargo Orders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end freight booking, status tracking, and delivery confirmation.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Book Shipment
          </Button>
        )}
      </div>

      {actionSuccess && (
        <Alert variant="success">{actionSuccess}</Alert>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Bookings</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">In Transit</p>
              <p className="text-2xl font-bold text-sky-600 mt-0.5">
                {shipments.filter((s) => s.status === 'IN_TRANSIT').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Delivered</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {shipments.filter((s) => s.status === 'DELIVERED').length}
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
              <p className="text-xs font-medium text-slate-500">Pending Dispatch</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                {shipments.filter((s) => s.status === 'PENDING').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by reference, cargo, or city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading shipment records...</div>
          ) : shipments.length === 0 ? (
            <EmptyState
              icon={<Package className="w-8 h-8 text-slate-400" />}
              title="No shipments found"
              description="Create freight orders to dispatch trips and track customer deliveries."
              actionText={!isViewer ? 'Book Shipment' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Shipment Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Cargo / Payload</th>
                    <th className="py-3 px-4">Agreed Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {shipments.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {s.shipmentNumber}
                          {getPriorityBadge(s.priority)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(s.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {s.customerId?.name || 'Unknown Client'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.customerId?.contactPerson || ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.origin.city} &rarr; {s.destination.city}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {s.cargoDescription}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.weightKg.toLocaleString()} kg &bull; {s.cargoCategory}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.agreedPrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(s.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedShipment(s);
                              setDetailsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {s.status === 'IN_TRANSIT' && !isViewer && (
                            <button
                              onClick={() => openPodModal(s)}
                              className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              title="Confirm Proof of Delivery"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}

                          {!isViewer && s.status !== 'IN_TRANSIT' && (
                            <button
                              onClick={() => setArchiveTarget(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Archive Shipment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} ({total} shipments)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Shipment Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Book New Shipment Order">
        <form onSubmit={handleSubmit(onSubmitShipment)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Client *</label>
              <select
                {...register('customerId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.contactPerson})</option>
                ))}
              </select>
              {errors.customerId && <p className="text-xs text-rose-500 mt-1">{errors.customerId.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shipment Number (Optional)</label>
              <Input {...register('shipmentNumber')} placeholder="e.g. SHP-2026-001" className="mt-1" />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Route & Locations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Origin / Pickup</p>
                <Input {...register('originCity')} placeholder="Origin City *" />
                <Input {...register('originAddress')} placeholder="Pickup Facility Address *" />
                <Input {...register('originContactPhone')} placeholder="Pickup Phone" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Destination / Delivery</p>
                <Input {...register('destinationCity')} placeholder="Destination City *" />
                <Input {...register('destinationAddress')} placeholder="Delivery Address *" />
                <Input {...register('destinationContactPhone')} placeholder="Consignee Phone" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cargo Specifications</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cargo Description *</label>
                <Input {...register('cargoDescription')} placeholder="e.g. 50 Cartons of Automotive Spares" className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  {...register('cargoCategory')}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="GENERAL">General Freight</option>
                  <option value="HEAVY_MACHINERY">Heavy Machinery</option>
                  <option value="PERISHABLE">Perishable / Cold</option>
                  <option value="FRAGILE">Fragile</option>
                  <option value="HAZARDOUS">Hazardous</option>
                  <option value="PARCEL">Parcel / Retail</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weight (kg) *</label>
                <Input type="number" {...register('weightKg', { valueAsNumber: true })} className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Express</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agreed Client Price (₹) *</label>
                <Input type="number" {...register('agreedPrice', { valueAsNumber: true })} className="mt-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Proof of Delivery Modal */}
      <Modal isOpen={podModalOpen} onClose={() => setPodModalOpen(false)} title="Confirm Proof of Delivery">
        <form onSubmit={handlePodSubmit(onSubmitPod)} className="space-y-4">
          <p className="text-xs text-slate-500">
            Record recipient confirmation details for shipment <span className="font-bold text-slate-900 dark:text-white">{selectedShipment?.shipmentNumber}</span>.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recipient / Consignee Name *</label>
            <Input {...registerPod('recipientName')} placeholder="e.g. Ramesh Kumar (Warehouse Lead)" className="mt-1" />
            {podErrors.recipientName && <p className="text-xs text-rose-500 mt-1">{podErrors.recipientName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recipient Phone</label>
              <Input {...registerPod('recipientPhone')} placeholder="+91 98..." className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">POD Docket / Stamp #</label>
              <Input {...registerPod('podNumber')} placeholder="e.g. POD-2026-99" className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delivery Notes</label>
            <Input {...registerPod('notes')} placeholder="Received in sound physical condition..." className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setPodModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPodSubmitting}>
              Confirm Delivery
            </Button>
          </div>
        </form>
      </Modal>

      {/* Shipment Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title={`Shipment ${selectedShipment?.shipmentNumber}`}>
        {selectedShipment && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedShipment.cargoDescription}</p>
                <p className="text-slate-400 mt-0.5">{selectedShipment.weightKg} kg &bull; {selectedShipment.cargoCategory}</p>
              </div>
              <div>{getStatusBadge(selectedShipment.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">Origin / Shipper</p>
                <p>{selectedShipment.origin.city}, {selectedShipment.origin.state || ''}</p>
                <p className="text-slate-400">{selectedShipment.origin.address}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">Destination / Consignee</p>
                <p>{selectedShipment.destination.city}, {selectedShipment.destination.state || ''}</p>
                <p className="text-slate-400">{selectedShipment.destination.address}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Client / Customer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedShipment.customerId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agreed Price:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedShipment.agreedPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Operating Cost:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(selectedShipment.estimatedCost)}</span>
              </div>
              {selectedShipment.deliveryConfirmation && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Proof of Delivery Confirmed
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    Received by: <span className="font-semibold">{selectedShipment.deliveryConfirmation.recipientName}</span> on {formatDateTime(selectedShipment.deliveryConfirmation.deliveredAt)}
                  </p>
                  <p className="text-slate-400">POD Docket: {selectedShipment.deliveryConfirmation.podNumber}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Shipment Order"
        message={`Are you sure you want to archive shipment order "${archiveTarget?.shipmentNumber}"?`}
        confirmText="Archive Shipment"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
