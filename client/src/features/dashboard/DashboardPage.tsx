import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ShieldCheck,
  Activity,
  Truck,
  Navigation,
  Wrench,
  Fuel,
  ArrowRight,
  UserPlus,
  Settings,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { StatCard } from '../../components/shared/StatCard.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { api } from '../../lib/api.js';
import { formatDateTime } from '../../lib/utils.js';

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

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg shadow-brand-900/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>FleetFlow Workspace Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Operating <span className="font-bold text-white">{company?.name}</span> under isolated multi-tenant architecture. All operational metrics below are computed from your dedicated company database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/users">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="bg-white/10 hover:bg-white/20 text-white border-0"
              >
                Manage Team
              </Button>
            </Link>
            <Link to="/company/profile">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Settings className="w-4 h-4" />}
                className="bg-brand-500 hover:bg-brand-400"
              >
                Company Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Section: Phase 1 Real Data & Honest Roadmap Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <span>Operational Health & Overview</span>
          </h2>
          <span className="text-xs text-slate-500">Live Database Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Real Phase 1 Stat: Team Members */}
          <StatCard
            title="Team Members"
            value={overview?.team?.totalMembers ?? 1}
            subtitle={`${overview?.team?.activeMembers ?? 1} active in workspace`}
            icon={<Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
            iconBg="bg-brand-50 dark:bg-brand-950/60"
            isLoading={loading}
            badge={<Badge variant="success" size="sm">Phase 1 Live</Badge>}
          />

          {/* Real Phase 1 Stat: Drivers Onboarded */}
          <StatCard
            title="Driver Accounts"
            value={overview?.drivers?.totalDrivers ?? 0}
            subtitle={overview?.drivers?.status || 'Assigned role accounts'}
            icon={<ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/60"
            isLoading={loading}
            badge={<Badge variant="primary" size="sm">Phase 1 Live</Badge>}
          />

          {/* Phase 2 Roadmap: Vehicles & Fleet */}
          <StatCard
            title="Active Vehicles"
            value="0"
            subtitle="Vehicle CRUD & telemetry in Phase 2"
            icon={<Truck className="w-5 h-5 text-slate-400" />}
            iconBg="bg-slate-100 dark:bg-slate-800"
            isLoading={loading}
            badge={<Badge variant="secondary" size="sm">Phase 2</Badge>}
          />

          {/* Phase 3 Roadmap: Trips & Dispatches */}
          <StatCard
            title="Active Trips"
            value="0"
            subtitle="GPS routes & dispatch in Phase 3"
            icon={<Navigation className="w-5 h-5 text-slate-400" />}
            iconBg="bg-slate-100 dark:bg-slate-800"
            isLoading={loading}
            badge={<Badge variant="secondary" size="sm">Phase 3</Badge>}
          />
        </div>
      </div>

      {/* Grid: Activity Stream and System Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Team Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Workspace Activity</CardTitle>
                <CardDescription>
                  Audit log of recent user creations and role assignments
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
                {activities.map((act) => (
                  <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Actor: {act.actor}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(act.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Platform Architecture & Modules Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>System Architecture Status</CardTitle>
            <CardDescription>
              Phase 1 Deliverables & Roadmap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Tenant Isolation & Auth</span>
                <Badge variant="success" size="sm">Operational</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">9 RBAC Roles & Permissions</span>
                <Badge variant="success" size="sm">Operational</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">MongoDB Atlas Database</span>
                <Badge variant="success" size="sm">Connected</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>Fleet & Maintenance Module</span>
                <Badge variant="secondary" size="sm">Phase 2</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>AI Cost Predictor & GPS Trips</span>
                <Badge variant="secondary" size="sm">Phase 3</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link to="/users">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Go to User Management</span>
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
