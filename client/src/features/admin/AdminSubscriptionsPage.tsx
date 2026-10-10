import React, { useEffect, useState } from 'react';
import { Layers, RefreshCw, ChevronLeft, ChevronRight, Edit3, X, Calendar, CheckCircle } from 'lucide-react';
import { adminService, AdminSubscription, AdminPlan } from '../../services/admin.service.js';

export const AdminSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // Edit Modal State
  const [editingSub, setEditingSub] = useState<AdminSubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [extendDays, setExtendDays] = useState<number>(30);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        adminService.getSubscriptions({ page, limit: 15, status: statusFilter || undefined }),
        adminService.getPlans(),
      ]);
      setSubscriptions(subsRes.subscriptions);
      setTotalPages(subsRes.pagination.totalPages);
      setTotal(subsRes.pagination.total);
      setPlans(plansRes);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter]);

  const openEditModal = (sub: AdminSubscription) => {
    setEditingSub(sub);
    setSelectedPlanId(sub.planId?._id || '');
    setSelectedStatus(sub.status);
    setExtendDays(30);
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setUpdating(true);
    try {
      const newEndDate = new Date(new Date(editingSub.endDate).getTime() + extendDays * 24 * 60 * 60 * 1000);
      await adminService.updateSubscription(editingSub._id, {
        planId: selectedPlanId || undefined,
        status: selectedStatus || undefined,
        endDate: newEndDate.toISOString(),
      });
      setEditingSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update subscription');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Company Subscriptions Directory
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {total} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active carrier workspaces, trial cycles, plan entitlements, and subscription renewals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Subscription Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <button
            onClick={fetchSubscriptions}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
            <p className="text-xs">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic">
            No company subscriptions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Company Workspace</th>
                  <th className="px-5 py-3.5">Tier Plan</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Billing Cycle</th>
                  <th className="px-5 py-3.5">Renewal / Expiry Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscriptions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-200 text-xs">{s.companyId?.name || 'Company'}</p>
                        <p className="text-[11px] text-slate-400">{s.companyId?.email}</p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-rose-400 font-mono text-xs">
                        {s.planCode || s.planId?.code}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        ${s.planId?.priceMonthly || 0}/mo • Max {s.planId?.maxVehicles || 0} vehicles
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                            : s.status === 'TRIAL'
                            ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                            : 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-300">
                      {s.billingCycle || 'MONTHLY'}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'Continuous'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Subscription Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Adjust Subscription</h3>
                <p className="text-xs text-slate-400">{editingSub.companyId?.name}</p>
              </div>
              <button onClick={() => setEditingSub(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Assign Plan Tier</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code}) — ${p.priceMonthly}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Subscription State</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Extend Validity (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                >
                  {updating ? 'Updating...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
