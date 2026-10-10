import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  User,
  Truck,
  Wrench,
  UserCheck,
  Package,
  Navigation,
  Fuel,
  Receipt,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Badge } from '../ui/Badge.js';
import { cn } from '../../lib/utils.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { company, user } = useAuth();

  const overviewNav = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  ];

  const operationsNavItems = [
    { label: 'Shipments & Orders', href: '/shipments', icon: Package },
    { label: 'Trips & Dispatch', href: '/trips', icon: Navigation },
  ];

  const fleetNavItems = [
    { label: 'Vehicles & Fleet', href: '/vehicles', icon: Truck },
    { label: 'Driver Profiles', href: '/drivers', icon: UserCheck },
    { label: 'Customers', href: '/customers', icon: Building2 },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench },
    { label: 'Fuel Logs', href: '/fuel', icon: Fuel },
    { label: 'Expenses', href: '/expenses', icon: Receipt },
  ];

  const aiAnalyticsNavItems = [
    { label: 'AI Fleet Intelligence', href: '/ai-insights', icon: Sparkles },
    { label: 'Reports & Analytics', href: '/reports', icon: Layers },
  ];

  const administrationNavItems = [
    { label: 'Team & Users', href: '/users', icon: Users },
    { label: 'Company Profile', href: '/company/profile', icon: Building2 },
    { label: 'My Account', href: '/settings/account', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white shadow-md shadow-brand-500/20 font-black text-lg">
              FF
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                FleetFlow
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  SaaS
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                {company?.name || 'Transport Workspace'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Overview */}
          <div>
            <nav className="space-y-1">
              {overviewNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Transport Operations (Phase 3) */}
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Transport Operations</span>
              <Badge variant="primary" size="sm" className="text-[9px] py-0 px-1">Phase 3</Badge>
            </div>
            <nav className="space-y-0.5">
              {operationsNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Fleet Management (Phase 2) */}
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Fleet Management</span>
              <Badge variant="primary" size="sm" className="text-[9px] py-0 px-1">Phase 2</Badge>
            </div>
            <nav className="space-y-0.5">
              {fleetNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* AI Intelligence & Analytics (Phase 4) */}
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>AI Intelligence</span>
              <Badge variant="success" size="sm" className="text-[9px] py-0 px-1">Phase 4</Badge>
            </div>
            <nav className="space-y-0.5">
              {aiAnalyticsNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Administration */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace & Team
            </div>
            <nav className="space-y-0.5">
              {administrationNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tenant Profile Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || 'FF'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
