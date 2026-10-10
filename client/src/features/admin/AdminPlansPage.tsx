import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Plus, Edit2, RefreshCw, X, Shield, Sparkles } from 'lucide-react';
import { adminService, AdminPlan } from '../../services/admin.service.js';

export const AdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<Partial<AdminPlan> | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEditModal = (plan: AdminPlan) => {
    setEditingPlan({ ...plan });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingPlan({
      code: '',
      name: '',
      description: '',
      priceMonthly: 49,
      priceYearly: 490,
      currency: 'USD',
      maxVehicles: 10,
      maxUsers: 5,
      maxShipmentsPerMonth: 100,
      features: ['Real-time vehicle tracking', 'Dispatch management'],
      isPopular: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);
    try {
      if (editingPlan._id) {
        await adminService.updatePlan(editingPlan._id, editingPlan);
      } else {
        await adminService.createPlan(editingPlan);
      }
      setModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Subscription Plan Architecture
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure commercial pricing tiers, operational capacity limits, and SaaS access features.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Plan Tier
          </button>
          <button
            onClick={fetchPlans}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
          <p className="text-xs">Loading subscription plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p._id}
              className={`rounded-2xl p-6 flex flex-col justify-between border relative transition-all ${
                p.isPopular
                  ? 'bg-slate-950/90 border-rose-500/60 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {p.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {p.code}
                  </span>
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-lg font-black text-white mt-3">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px] line-clamp-2">{p.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    ${p.priceMonthly}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Billed annually: ${p.priceYearly}/yr
                </p>

                {/* Capacity Limits */}
                <div className="my-5 p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Fleet Capacity:</span>
                    <span className="font-bold text-white">{p.maxVehicles} vehicles</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Team Members:</span>
                    <span className="font-bold text-white">{p.maxUsers} users</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Monthly Shipments:</span>
                    <span className="font-bold text-white">{p.maxShipmentsPerMonth} /mo</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Included Capabilities
                  </span>
                  {p.features?.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    p.isActive ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {p.isActive ? 'Active for Checkout' : 'Archived Tier'}
                </span>
                <button
                  onClick={() => openEditModal(p)}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300"
                >
                  Edit Limits
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {modalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingPlan._id ? `Edit Plan Tier: ${editingPlan.name}` : 'Create New Subscription Plan'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Plan Code</label>
                  <input
                    type="text"
                    disabled={!!editingPlan._id}
                    required
                    placeholder="e.g. ENTERPRISE_PLUS"
                    value={editingPlan.code || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceMonthly ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Yearly Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceYearly ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Hard Capacity Limits */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Vehicles</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingPlan.maxVehicles ?? 5}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxVehicles: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Users</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingPlan.maxUsers ?? 3}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxUsers: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Max Shipments</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingPlan.maxShipmentsPerMonth ?? 50}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxShipmentsPerMonth: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Features (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={editingPlan.features?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split(',').map((f) => f.trim()).filter(Boolean),
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isPopular || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-rose-600"
                  />
                  Highlight as Popular
                </label>
                <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive ?? true}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-rose-600"
                  />
                  Active for Customers
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Plan Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
