import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Truck,
  Package,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { adminService, AdminOverviewData } from '../../services/admin.service.js';

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load platform overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mb-3" />
        <p className="text-xs font-semibold uppercase tracking-wider">Aggregating Cross-Platform Metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200">
        <p className="font-bold text-sm">Failed to load platform overview</p>
        <p className="text-xs text-rose-300 mt-1">{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-4 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Platform Master Console
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Live Production
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant monitoring, tenant governance, and platform operational analytics.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Companies */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Companies</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.companies.total}</span>
            <span className="text-xs font-semibold text-emerald-400">
              {data.companies.active} Active
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <span>{data.companies.trial} in Trial</span>
            <span>•</span>
            <span className={data.companies.suspended > 0 ? 'text-rose-400 font-bold' : ''}>
              {data.companies.suspended} Suspended
            </span>
          </div>
        </div>

        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Users</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.users.total}</span>
            <span className="text-xs font-semibold text-emerald-400">{data.users.active} Active</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Total authorized user identities</p>
        </div>

        {/* Total Fleet */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Fleet</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.fleet.vehicles}</span>
            <span className="text-xs font-semibold text-slate-300">Vehicles</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">{data.fleet.drivers} Registered Drivers</p>
        </div>

        {/* Financial Flow */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billed Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              ₹{data.finance.totalBilled.toLocaleString()}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Collected: ₹{data.finance.totalCollected.toLocaleString()} • {data.finance.invoiceCount} Invoices
          </p>
        </div>
      </div>

      {/* Operations, Subscriptions, & AI telemetry row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Activity */}
        <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              Operational Volume
              <Package className="w-4 h-4 text-slate-500" />
            </h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Total Shipment Orders</span>
                <span className="text-sm font-black text-white">{data.operations.shipments}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Total Dispatch Trips</span>
                <span className="text-sm font-black text-white">{data.operations.trips}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Completed Trips</span>
                <span className="text-sm font-black text-emerald-400">{data.operations.completedTrips}</span>
              </div>
            </div>
          </div>
          <Link
            to="/admin/companies"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            Manage Transport Companies <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Subscription Plan Distribution */}
        <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              Plan Distribution
              <Layers className="w-4 h-4 text-slate-500" />
            </h2>
            <div className="mt-6 space-y-3">
              {data.subscriptions.planDistribution.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No subscriptions registered yet.</p>
              ) : (
                data.subscriptions.planDistribution.map((item) => (
                  <div key={item.plan} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-semibold text-slate-300">{item.plan}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                      {item.count} tenants
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <Link
            to="/admin/plans"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            Configure Subscription Tiers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* AI/ML Telemetry */}
        <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              AI/ML Telemetry
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Trip Cost Inferences</span>
                <span className="text-sm font-black text-white">{data.aiMonitoring.totalRequests}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Average Latency</span>
                <span className="text-sm font-black text-white">{data.aiMonitoring.avgLatencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Fallback Usage</span>
                <span className="text-sm font-black text-slate-300">{data.aiMonitoring.fallbackCount} requests</span>
              </div>
            </div>
          </div>
          <Link
            to="/admin/ai-monitoring"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            Inspect AI Telemetry & Error Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Administrative Actions Audit Trail */}
      <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Recent Administrative Audit Trail
          </h2>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            View Complete Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recentActivity.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center italic">No administrative actions recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {data.recentActivity.map((log) => (
              <div key={log._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {log.action}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {log.details?.companyName || log.details?.email || log.targetType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>By: {log.actorEmail}</span>
                  <span>•</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
