import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
  Truck,
  Users,
  Package,
} from 'lucide-react';
import { adminService, AdminCompany } from '../../services/admin.service.js';

export const AdminCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // Detail Modal State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Status Action Modal State
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    company: AdminCompany | null;
    targetStatus: 'ACTIVE' | 'SUSPENDED';
    reason: string;
    submitting: boolean;
  }>({
    open: false,
    company: null,
    targetStatus: 'SUSPENDED',
    reason: '',
    submitting: false,
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCompanies({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setCompanies(res.companies);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const openDetails = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setDetailsLoading(true);
    try {
      const details = await adminService.getCompanyDetails(companyId);
      setCompanyDetails(details);
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openStatusModal = (company: AdminCompany, targetStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionModal({
      open: true,
      company,
      targetStatus,
      reason: '',
      submitting: false,
    });
  };

  const submitStatusChange = async () => {
    if (!actionModal.company) return;
    setActionModal((prev) => ({ ...prev, submitting: true }));
    try {
      await adminService.updateCompanyStatus(
        actionModal.company._id,
        actionModal.targetStatus,
        actionModal.reason || undefined
      );
      setActionModal((prev) => ({ ...prev, open: false }));
      fetchCompanies();
      if (selectedCompanyId === actionModal.company._id) {
        openDetails(actionModal.company._id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update company status');
    } finally {
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Company Tenant Directory
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {total} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, inspect operational capacity, and enforce workspace governance across all registered carriers.
          </p>
        </div>
        <button
          onClick={fetchCompanies}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies by name, email, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Workspaces</option>
            <option value="TRIAL">Trial Workspaces</option>
            <option value="SUSPENDED">Suspended Workspaces</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
            <p className="text-xs">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic">
            No company workspaces found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Company Profile</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Subscription Plan</th>
                  <th className="px-5 py-3.5">Owner Contact</th>
                  <th className="px-5 py-3.5">Fleet / Users</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-xs">{c.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">slug: {c.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {c.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                      {c.status === 'TRIAL' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-800/60">
                          <AlertTriangle className="w-3 h-3" /> TRIAL
                        </span>
                      )}
                      {c.status === 'SUSPENDED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-400 border border-rose-800/60">
                          <Ban className="w-3 h-3" /> SUSPENDED
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-300">
                        {c.subscription?.planCode || 'STARTER'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-slate-200 font-medium">{c.ownerId?.name || 'Owner unassigned'}</p>
                      <p className="text-[11px] text-slate-400">{c.ownerId?.email || c.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-slate-300 font-semibold">
                        {c.metrics?.vehicles || 0} vehicles • {c.metrics?.users || 0} users
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetails(c._id)}
                          title="View Full Company Dossier"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>

                        {c.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => openStatusModal(c, 'ACTIVE')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/40 font-bold text-[11px] transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => openStatusModal(c, 'SUSPENDED')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/40 font-bold text-[11px] transition-colors"
                          >
                            Suspend
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages} ({total} companies)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Drawer / Modal */}
      {selectedCompanyId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Company Workspace Profile</h2>
                  <p className="text-xs text-slate-400">{companyDetails?.company?.name || 'Loading...'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCompanyId(null);
                  setCompanyDetails(null);
                }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading || !companyDetails ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                <p className="text-xs">Fetching company telemetry...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status & Plan Info */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Workspace Status
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">{companyDetails.company.status}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan Code</span>
                    <p className="text-sm font-bold text-rose-400 mt-0.5">
                      {companyDetails.subscription?.planCode || 'STARTER'}
                    </p>
                  </div>
                </div>

                {/* Capacity Summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Truck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-base font-black text-white">{companyDetails.metrics.vehicleCount}</span>
                    <p className="text-[10px] text-slate-400">Fleet Vehicles</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <span className="text-base font-black text-white">{companyDetails.metrics.userCount}</span>
                    <p className="text-[10px] text-slate-400">Team Users</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Package className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <span className="text-base font-black text-white">{companyDetails.metrics.shipmentCount}</span>
                    <p className="text-[10px] text-slate-400">Shipments</p>
                  </div>
                </div>

                {/* Team Users List */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Authorized Team Members ({companyDetails.users?.length || 0})
                  </h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {companyDetails.users?.map((u: any) => (
                      <div
                        key={u._id}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-200">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit History */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Administrative Governance Log
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {companyDetails.auditHistory?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No administrative events recorded.</p>
                    ) : (
                      companyDetails.auditHistory?.map((a: any) => (
                        <div
                          key={a._id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-400 text-[10px] font-mono">{a.action}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {a.details?.reason && (
                            <p className="text-[11px] text-slate-300 italic">"{a.details.reason}"</p>
                          )}
                          <p className="text-[10px] text-slate-500">By: {a.actorEmail}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  actionModal.targetStatus === 'SUSPENDED'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {actionModal.targetStatus === 'SUSPENDED' ? 'Suspend Company Workspace' : 'Reactivate Workspace'}
                </h3>
                <p className="text-xs text-slate-400">{actionModal.company?.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {actionModal.targetStatus === 'SUSPENDED'
                ? 'Suspending this workspace will immediately revoke access for all company users, block login, and reject API calls. No operational data will be deleted.'
                : 'Reactivating will restore normal authentication and permissions for this transport company.'}
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Administrative Note / Reason
              </label>
              <textarea
                rows={3}
                placeholder="Document reason for audit log (e.g., Billing default, compliance review, owner request)..."
                value={actionModal.reason}
                onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={actionModal.submitting}
                onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={actionModal.submitting}
                onClick={submitStatusChange}
                className={`px-4 py-2 rounded-xl font-bold text-xs text-white transition-colors ${
                  actionModal.targetStatus === 'SUSPENDED'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {actionModal.submitting
                  ? 'Updating...'
                  : actionModal.targetStatus === 'SUSPENDED'
                  ? 'Confirm Suspension'
                  : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
