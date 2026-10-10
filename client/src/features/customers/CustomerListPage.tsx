import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { ICustomer, CustomerType, CustomerStatus } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { customerService } from '../../services/customer.service.js';

const customerFormSchema = z.object({
  name: z.string().min(2, 'Customer name is required').max(150).trim(),
  customerType: z.enum(['CORPORATE', 'INDIVIDUAL', 'FORWARDER', 'RETAIL']),
  contactPerson: z.string().min(2, 'Contact person is required').max(100).trim(),
  phone: z.string().min(7, 'Phone number required').max(20).trim(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  taxId: z.string().optional().nullable(),
  paymentTerms: z.string().default('NET 30'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export const CustomerListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ICustomer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerType: 'CORPORATE',
      paymentTerms: 'NET 30',
      status: 'ACTIVE',
    },
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      });
      setCustomers(data.customers);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormError(null);
    reset({
      name: '',
      customerType: 'CORPORATE',
      contactPerson: '',
      phone: '',
      email: '',
      taxId: '',
      paymentTerms: 'NET 30',
      status: 'ACTIVE',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (cust: ICustomer) => {
    setEditingCustomer(cust);
    setFormError(null);
    setValue('name', cust.name);
    setValue('customerType', cust.customerType);
    setValue('contactPerson', cust.contactPerson);
    setValue('phone', cust.phone);
    setValue('email', cust.email || '');
    setValue('taxId', cust.taxId || '');
    setValue('paymentTerms', cust.paymentTerms || 'NET 30');
    setValue('status', cust.status);
    setValue('street', cust.billingAddress?.street || '');
    setValue('city', cust.billingAddress?.city || '');
    setValue('state', cust.billingAddress?.state || '');
    setValue('postalCode', cust.billingAddress?.postalCode || '');
    setValue('notes', cust.notes || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    setFormError(null);
    try {
      const payload: any = {
        name: data.name,
        customerType: data.customerType,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email || null,
        taxId: data.taxId || null,
        paymentTerms: data.paymentTerms,
        status: data.status,
        billingAddress: data.city || data.street ? {
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: 'India',
        } : null,
        notes: data.notes || null,
      };

      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer._id, payload);
        setActionSuccess(`Customer "${data.name}" updated successfully.`);
      } else {
        await customerService.createCustomer(payload);
        setActionSuccess(`Customer "${data.name}" onboarded successfully.`);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await customerService.archiveCustomer(archiveTarget._id);
      setActionSuccess(`Customer "${archiveTarget.name}" archived.`);
      setArchiveTarget(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive customer.');
    }
  };

  const getStatusBadge = (status: CustomerStatus) => {
    return status === 'ACTIVE' ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Customers' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Customer Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage logistics clients, shipping accounts, tax IDs, and billing contacts.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Customer
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
              <p className="text-xs font-medium text-slate-500">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Accounts</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {customers.filter((c) => c.status === 'ACTIVE').length}
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
              <p className="text-xs font-medium text-slate-500">Corporate Clients</p>
              <p className="text-2xl font-bold text-sky-600 mt-0.5">
                {customers.filter((c) => c.customerType === 'CORPORATE').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Forwarders</p>
              <p className="text-2xl font-bold text-purple-600 mt-0.5">
                {customers.filter((c) => c.customerType === 'FORWARDER').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers, contact persons, phone, or email..."
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
                <option value="">All Customer Types</option>
                <option value="CORPORATE">Corporate</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="FORWARDER">Forwarder</option>
                <option value="RETAIL">Retail</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading customer accounts...</div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<Building className="w-8 h-8 text-slate-400" />}
              title="No customer accounts found"
              description="Onboard transport shippers and logistics clients to manage bookings and invoices."
              actionText={!isViewer ? 'Add Customer' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Contact Person & Phone</th>
                    <th className="py-3 px-4">Tax ID / GSTIN</th>
                    <th className="py-3 px-4">Payment Terms</th>
                    <th className="py-3 px-4">Status</th>
                    {!isViewer && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                        {c.billingAddress?.city && (
                          <div className="text-xs text-slate-400">
                            {c.billingAddress.city}, {c.billingAddress.state || 'India'}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" size="sm">
                          {c.customerType}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.contactPerson}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </span>
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {c.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {c.taxId || <span className="text-slate-400 italic font-sans">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {c.paymentTerms || 'NET 30'}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                      {!isViewer && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setArchiveTarget(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Archive Customer"
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
                Showing {customers.length} of {total} customer accounts
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
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add Customer'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Name *</label>
              <Input {...register('name')} placeholder="Company / Individual Name" className="mt-1" error={errors.name?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Type</label>
              <select
                {...register('customerType')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="CORPORATE">Corporate</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="FORWARDER">Freight Forwarder</option>
                <option value="RETAIL">Retail</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Contact Person *</label>
              <Input {...register('contactPerson')} placeholder="Key representative" className="mt-1" error={errors.contactPerson?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
              <Input {...register('phone')} placeholder="+91 ..." className="mt-1" error={errors.phone?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <Input {...register('email')} type="email" placeholder="billing@client.com" className="mt-1" error={errors.email?.message} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax ID / GSTIN</label>
              <Input {...register('taxId')} placeholder="Optional GSTIN/TIN" className="mt-1 uppercase" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Terms</label>
              <Input {...register('paymentTerms')} placeholder="e.g. NET 30, Advance" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City</label>
              <Input {...register('city')} placeholder="Mumbai, Delhi..." className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">State</label>
              <Input {...register('state')} placeholder="Maharashtra, Gujarat..." className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                {...register('status')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Street Address</label>
            <Input {...register('street')} placeholder="Office / Warehouse address" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
            <Input {...register('notes')} placeholder="Optional billing or delivery remarks" className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Customer"
        message={`Are you sure you want to archive customer "${archiveTarget?.name}"?`}
        confirmText="Archive Customer"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
