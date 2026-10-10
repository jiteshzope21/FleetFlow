import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Activity,
  Truck,
  Wrench,
  Fuel,
  Receipt,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { StatCard } from '../../components/shared/StatCard.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { api } from '../../lib/api.js';
import { formatDateTime, formatCurrency } from '../../lib/utils.js';

export const DashboardPage: React.FC = () => {
  const { user, company } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [overviewRes, activityRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/activity'),
        ]);

        if (overviewRes.data?.success) {
          setOverview(overviewRes.data.data);
        }
        if (activityRes.data?.success) {
          setActivities(activityRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const currency = overview?.company?.currency || company?.settings?.currency || 'INR';

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome & Fast Actions Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg shadow-brand-900/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>FleetFlow Phase 2 Workspace Operational</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Operating <span className="font-bold text-white">{company?.name}</span> under isolated multi-tenant architecture. All fleet metrics below are aggregated live from your company database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/vehicles">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-white/10 hover:bg-white/20 text-white border-0"
              >
                Vehicles
              </Button>
            </Link>
            <Link to="/maintenance">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Wrench className="w-4 h-4" />}
                className="bg-white/10 hover:bg-white/20 text-white border-0"
              >
                Maintenance
              </Button>
            </Link>
            <Link to="/fuel">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Fuel className="w-4 h-4" />}
                className="bg-brand-500 hover:bg-brand-400"
              >
                Log Fuel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Expiry / Maintenance Alert Banner if any */}
      {(overview?.alerts?.totalAlerts > 0) && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Operational Compliance & Service Warnings ({overview?.alerts?.totalAlerts})
              </p>
              <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300/80">
                {overview?.alerts?.expiringVehicleDocs ?? 0} vehicle document(s) expiring within 30 days &bull;{' '}
                {overview?.alerts?.expiringDriverLicenses ?? 0} driver licence(s) expiring soon &bull;{' '}
                {overview?.maintenance?.scheduled ?? 0} scheduled maintenance service(s).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/vehicles">
              <Button variant="outline" size="sm" className="border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                Inspect Fleet
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Row 1: Core Operational Fleet Resources */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <span>Fleet & Resource Status</span>
          </h2>
          <span className="text-xs text-slate-500">Live Database Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vehicles Card */}
          <Link to="/vehicles" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Vehicles in Fleet"
              value={overview?.fleet?.totalVehicles ?? 0}
              subtitle={`${overview?.fleet?.activeVehicles ?? 0} Active &bull; ${overview?.fleet?.inMaintenanceVehicles ?? 0} In Shop`}
              icon={<Truck className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
              iconBg="bg-brand-50 dark:bg-brand-950/60"
              isLoading={loading}
              badge={<Badge variant="primary" size="sm">Phase 2</Badge>}
            />
          </Link>

          {/* Drivers Card */}
          <Link to="/drivers" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Drivers Onboarded"
              value={overview?.drivers?.totalDrivers ?? 0}
              subtitle={`${overview?.drivers?.activeDrivers ?? 0} Active licensed drivers`}
              icon={<UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-50 dark:bg-emerald-950/60"
              isLoading={loading}
              badge={<Badge variant="success" size="sm">Phase 2</Badge>}
            />
          </Link>

          {/* Customers Card */}
          <Link to="/customers" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Customer Accounts"
              value={overview?.customers?.totalCustomers ?? 0}
              subtitle={`${overview?.customers?.activeCustomers ?? 0} Active client accounts`}
              icon={<Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
              iconBg="bg-sky-50 dark:bg-sky-950/60"
              isLoading={loading}
              badge={<Badge variant="primary" size="sm">Phase 2</Badge>}
            />
          </Link>

          {/* Maintenance Card */}
          <Link to="/maintenance" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Active Maintenance"
              value={(overview?.maintenance?.scheduled ?? 0) + (overview?.maintenance?.inProgress ?? 0)}
              subtitle={`${overview?.maintenance?.scheduled ?? 0} Scheduled &bull; ${overview?.maintenance?.inProgress ?? 0} In Progress`}
              icon={<Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-50 dark:bg-amber-950/60"
              isLoading={loading}
              badge={<Badge variant="warning" size="sm">Phase 2</Badge>}
            />
          </Link>
        </div>
      </div>

      {/* Row 2: Operational Expenditures & Fuel Logs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Financials & Consumption</span>
          </h2>
          <span className="text-xs text-slate-500">Non-overlapping Expense Totals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Operating Cost */}
          <Link to="/expenses" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Total Operating Cost"
              value={formatCurrency(overview?.expenses?.totalOperatingCost ?? 0, currency)}
              subtitle="General + Fuel + Maintenance"
              icon={<Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              iconBg="bg-purple-50 dark:bg-purple-950/60"
              isLoading={loading}
              badge={<Badge variant="primary" size="sm">Combined</Badge>}
            />
          </Link>

          {/* Fuel Spend */}
          <Link to="/fuel" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Fuel Expenditure"
              value={formatCurrency(overview?.fuel?.totalCost ?? 0, currency)}
              subtitle={`${(overview?.fuel?.totalQuantity ?? 0).toLocaleString()} Litres logged`}
              icon={<Fuel className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-50 dark:bg-blue-950/60"
              isLoading={loading}
              badge={<Badge variant="primary" size="sm">Phase 2</Badge>}
            />
          </Link>

          {/* Maintenance Spend */}
          <Link to="/maintenance" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Maintenance Spend"
              value={formatCurrency(overview?.maintenance?.expenditure ?? 0, currency)}
              subtitle="Parts & Workshop Labour"
              icon={<Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-50 dark:bg-amber-950/60"
              isLoading={loading}
              badge={<Badge variant="warning" size="sm">Phase 2</Badge>}
            />
          </Link>

          {/* General Operational Expenses */}
          <Link to="/expenses" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="General Ops Expenses"
              value={formatCurrency(overview?.expenses?.generalExpense ?? 0, currency)}
              subtitle="Tolls, Parking, Permits & Admin"
              icon={<Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-50 dark:bg-emerald-950/60"
              isLoading={loading}
              badge={<Badge variant="success" size="sm">Phase 2</Badge>}
            />
          </Link>
        </div>
      </div>

      {/* Grid: Activity Stream and System Architecture Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Operational Activity</CardTitle>
                <CardDescription>
                  Audit log of recent vehicles, drivers, maintenance, and expense entries
                </CardDescription>
              </div>
              <Badge variant="primary" size="sm">Live Logs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activities.map((act) => {
                  let Icon = Activity;
                  let iconColor = 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60';
                  if (act.type === 'VEHICLE_CREATED') {
                    Icon = Truck;
                    iconColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60';
                  } else if (act.type === 'MAINTENANCE_LOGGED') {
                    Icon = Wrench;
                    iconColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60';
                  } else if (act.type === 'FUEL_LOGGED') {
                    Icon = Fuel;
                    iconColor = 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60';
                  } else if (act.type === 'EXPENSE_RECORDED') {
                    Icon = Receipt;
                    iconColor = 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60';
                  } else if (act.type === 'USER_CREATED') {
                    Icon = Users;
                    iconColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60';
                  }

                  return (
                    <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${iconColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Actor: {act.actor}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(act.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity recorded yet. Create vehicles, maintenance, or fuel logs to see live audit logs.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Platform Architecture & Modules Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Architecture Status</CardTitle>
            <CardDescription>
              Phase 1 & Phase 2 Modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Tenant Isolation & Auth</span>
                <Badge variant="success" size="sm">Phase 1</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Vehicles & Driver Profiles</span>
                <Badge variant="success" size="sm">Phase 2 Live</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Customer CRM & Tax Records</span>
                <Badge variant="success" size="sm">Phase 2 Live</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Maintenance & Odometer Sync</span>
                <Badge variant="success" size="sm">Phase 2 Live</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Fuel Logs & Expenditure Audit</span>
                <Badge variant="success" size="sm">Phase 2 Live</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>Shipments & GPS Tracking</span>
                <Badge variant="secondary" size="sm">Phase 3</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>AI Cost Predictor</span>
                <Badge variant="secondary" size="sm">Phase 3</Badge>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <Link to="/vehicles">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Manage Vehicles Fleet</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
