import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Receipt,
  Plus,
  Search,
  Edit2,
  Trash2,
  IndianRupee,
  CreditCard,
  Truck,
  Building,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Tag,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IExpense, ExpenseCategory, PaymentMethod } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { expenseService } from '../../services/expense.service.js';
import { vehicleService } from '../../services/vehicle.service.js';
import { driverService } from '../../services/driver.service.js';
import { customerService } from '../../services/customer.service.js';

const expenseFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(150).trim(),
  category: z.enum([
    'TOLLS',
    'PARKING',
    'PERMITS',
    'INSURANCE',
    'TAXES',
    'OFFICE_SUPPLIES',
    'UTILITIES',
    'SALARIES',
    'DRIVER_ALLOWANCE',
    'LODGING',
    'MISCELLANEOUS',
  ]),
  expenseDate: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  currency: z.string().default('INR'),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER']),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export const ExpenseListPage: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';

  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Summary Metrics
  const [totalAmount, setTotalAmount] = useState(0);
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<IExpense | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IExpense | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: 'TOLLS',
      paymentMethod: 'UPI',
      currency: 'INR',
    },
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expenseService.getExpenses({
        page,
        limit: 10,
        category: categoryFilter || undefined,
        vehicleId: vehicleFilter || undefined,
      });
      setExpenses(data.expenses);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setTotalAmount(data.summary.totalAmount);
      setCategorySummary(data.summary.categorySummary || {});
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, vehicleFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    vehicleService.getVehicles({ limit: 100 }).then((d) => setVehicles(d.vehicles || [])).catch(() => {});
    driverService.getDrivers({ limit: 100 }).then((d) => setDrivers(d.drivers || [])).catch(() => {});
    customerService.getCustomers({ limit: 100 }).then((d) => setCustomers(d.customers || [])).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormError(null);
    reset({
      title: '',
      category: 'TOLLS',
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'INR',
      vehicleId: '',
      driverId: '',
      customerId: '',
      vendor: '',
      paymentMethod: 'UPI',
      referenceNumber: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (exp: IExpense) => {
    setEditingExpense(exp);
    setFormError(null);
    setValue('title', exp.title);
    setValue('category', exp.category);
    setValue('expenseDate', exp.expenseDate ? exp.expenseDate.split('T')[0] : '');
    setValue('amount', exp.amount);
    setValue('currency', exp.currency || 'INR');
    setValue('vehicleId', exp.vehicleId?._id || '');
    setValue('driverId', exp.driverId?._id || '');
    setValue('customerId', exp.customerId?._id || '');
    setValue('vendor', exp.vendor || '');
    setValue('paymentMethod', exp.paymentMethod);
    setValue('referenceNumber', exp.referenceNumber || '');
    setValue('notes', exp.notes || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setFormError(null);
    try {
      const payload: any = {
        title: data.title,
        category: data.category,
        expenseDate: data.expenseDate,
        amount: Number(data.amount),
        currency: data.currency,
        vehicleId: data.vehicleId || null,
        driverId: data.driverId || null,
        customerId: data.customerId || null,
        vendor: data.vendor || null,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense._id, payload);
        setActionSuccess('Expense record updated.');
      } else {
        await expenseService.createExpense(payload);
        setActionSuccess('Expense recorded successfully.');
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await expenseService.archiveExpense(archiveTarget._id);
      setActionSuccess('Expense record archived.');
      setArchiveTarget(null);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive expense.');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Operational Expenses' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Operational Expense Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track tolls, parking, permits, insurance, allowances, and general fleet overhead.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={openCreateModal} className="shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
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
              <p className="text-xs font-medium text-slate-500">Total Entries</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">General Overhead</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">₹{totalAmount.toLocaleString()}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Tolls & Parking</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">
                ₹{((categorySummary['TOLLS'] || 0) + (categorySummary['PARKING'] || 0)).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Permits & Insurance</p>
              <p className="text-2xl font-bold text-sky-600 mt-0.5">
                ₹{((categorySummary['PERMITS'] || 0) + (categorySummary['INSURANCE'] || 0)).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
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
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Categories</option>
                <option value="TOLLS">Tolls</option>
                <option value="PARKING">Parking</option>
                <option value="PERMITS">Permits & Toll Taxes</option>
                <option value="INSURANCE">Insurance Premiums</option>
                <option value="TAXES">Road Taxes</option>
                <option value="DRIVER_ALLOWANCE">Driver Allowance (Batta)</option>
                <option value="SALARIES">Staff Salaries</option>
                <option value="OFFICE_SUPPLIES">Office Supplies</option>
                <option value="UTILITIES">Utilities</option>
                <option value="LODGING">Lodging / Night Stays</option>
                <option value="MISCELLANEOUS">Miscellaneous</option>
              </select>
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading expense entries...</div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-8 h-8 text-slate-400" />}
              title="No expenses recorded"
              description="Keep accurate operational cost books by logging trip and vehicle overheads."
              actionText={!isViewer ? 'Add Expense' : undefined}
              onAction={!isViewer ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Vendor / Payee</th>
                    <th className="py-3 px-4">Linked Entity</th>
                    {!isViewer && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{e.title}</div>
                        <Badge variant="secondary" size="sm" className="mt-0.5">
                          {e.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{e.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {e.paymentMethod}
                        {e.referenceNumber && (
                          <span className="text-[10px] text-slate-400 block font-mono font-normal">
                            Ref: {e.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {e.vendor || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {e.vehicleId ? (
                          <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                            <Truck className="w-3.5 h-3.5" /> {e.vehicleId.registrationNumber}
                          </span>
                        ) : e.driverId ? (
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <UserCheck className="w-3.5 h-3.5" /> {e.driverId.name}
                          </span>
                        ) : e.customerId ? (
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Building className="w-3.5 h-3.5" /> {e.customerId.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">General Business</span>
                        )}
                      </td>
                      {!isViewer && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(e)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setArchiveTarget(e)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Archive Expense"
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
                Showing {expenses.length} of {total} expense entries
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
        title={editingExpense ? 'Edit Operational Expense' : 'Add Operational Expense'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expense Title *</label>
              <Input {...register('title')} placeholder="e.g. FASTag Recharge, Toll Tax, State Permit" className="mt-1" error={errors.title?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                {...register('category')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="TOLLS">Tolls</option>
                <option value="PARKING">Parking</option>
                <option value="PERMITS">Permits & Road Taxes</option>
                <option value="INSURANCE">Insurance Premiums</option>
                <option value="TAXES">Taxes</option>
                <option value="DRIVER_ALLOWANCE">Driver Allowance (Batta)</option>
                <option value="SALARIES">Salaries</option>
                <option value="OFFICE_SUPPLIES">Office Supplies</option>
                <option value="UTILITIES">Utilities</option>
                <option value="LODGING">Lodging / Night Stay</option>
                <option value="MISCELLANEOUS">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expense Date *</label>
              <Input {...register('expenseDate')} type="date" className="mt-1" error={errors.expenseDate?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount (₹) *</label>
              <Input {...register('amount')} type="number" step="0.01" className="mt-1" error={errors.amount?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Method</label>
              <select
                {...register('paymentMethod')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHECK">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Associated Vehicle</label>
              <select
                {...register('vehicleId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None (General)</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Associated Driver</label>
              <select
                {...register('driverId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Associated Client</label>
              <select
                {...register('customerId')}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vendor / Payee</label>
              <Input {...register('vendor')} placeholder="NHAI, State Transport, Hotel..." className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transaction / Reference #</label>
              <Input {...register('referenceNumber')} placeholder="Txn ID or receipt #" className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
            <Input {...register('notes')} placeholder="Optional comments" className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={!!archiveTarget}
        title="Archive Expense"
        message="Are you sure you want to archive this expense entry?"
        confirmText="Archive"
        isDangerous={true}
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};
