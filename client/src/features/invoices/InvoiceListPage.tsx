import React, { useEffect, useState } from 'react';
import { FileText, Plus, RefreshCw, CheckCircle2, Clock, AlertCircle, DollarSign, X } from 'lucide-react';
import { api } from '../../lib/api.js';

export const InvoiceListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Invoice Modal State
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: 'Freight Logistics Haulage', quantity: 1, unitPrice: 15000 },
  ]);
  const [creating, setCreating] = useState<boolean>(false);

  // Record Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; invoice: any | null }>({
    open: false,
    invoice: null,
  });
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [transRef, setTransRef] = useState<string>('');
  const [recordingPayment, setRecordingPayment] = useState<boolean>(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const [invRes, custRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/customers'),
      ]);
      setInvoices(invRes.data?.data?.invoices || []);
      setCustomers(custRes.data?.data?.customers || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) return;
    setCreating(true);
    try {
      await api.post('/invoices', {
        customerId,
        dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        items,
        taxRate,
        notes,
      });
      setCreateModal(false);
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.invoice || paymentAmount <= 0) return;
    setRecordingPayment(true);
    try {
      await api.post(`/invoices/${paymentModal.invoice._id}/payments`, {
        amount: paymentAmount,
        paymentMethod,
        transactionReference: transRef,
      });
      setPaymentModal({ open: false, invoice: null });
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Invoices & Customer Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate itemized tax invoices, record customer payments, and track outstanding freight balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
          <button
            onClick={fetchInvoices}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500 mb-2" />
            <p className="text-xs">Loading billing records...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs italic">
            No invoices generated yet. Click "Create Invoice" to bill a customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Billed Customer</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Paid / Collected</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
                      {inv.invoiceNumber}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{inv.customerId?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{inv.customerId?.email}</p>
                    </td>

                    <td className="px-5 py-4 font-black text-slate-900 dark:text-white">
                      ₹{inv.totalAmount.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{inv.paidAmount.toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-500 text-[11px]">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setPaymentModal({ open: true, invoice: inv });
                            setPaymentAmount(inv.totalAmount - inv.paidAmount);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Freight Customer Invoice</h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Select Customer</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email || c.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-500 dark:text-slate-400 font-bold">Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Item Description"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-16 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-24 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 font-bold px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">GST / Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-32 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold"
                >
                  {creating ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModal.open && paymentModal.invoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Customer Payment</h3>
              <button
                onClick={() => setPaymentModal({ open: false, invoice: null })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / Digital</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                  Transaction Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR / Cheque #"
                  value={transRef}
                  onChange={(e) => setTransRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ open: false, invoice: null })}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {recordingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
