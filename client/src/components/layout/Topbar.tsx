import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, Bell, CheckCircle2, AlertCircle, Building, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { Badge } from '../ui/Badge.js';
import { api } from '../../lib/api.js';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, company, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; status: string } | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        if (res.data?.data?.database) {
          setDbStatus(res.data.data.database);
        }
      } catch {
        setDbStatus({ connected: false, status: 'offline' });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left section: Hamburger & Company identification */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {company?.name || 'Workspace'}
              </span>
              <Badge variant="success" size="sm" className="hidden md:inline-flex">
                {company?.status || 'ACTIVE'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Tenant ID: {company?.slug || 'tenant'}
            </p>
          </div>
        </div>
      </div>

      {/* Right section: System health, theme, notifications, user */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live DB connectivity pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60"
          title={`MongoDB Connection Status: ${dbStatus?.status || 'Checking...'}`}
        >
          {dbStatus?.connected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="text-slate-600 dark:text-slate-300">
            {dbStatus?.connected ? 'DB Connected' : 'DB Checking'}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Foundation */}
        <button
          aria-label="Notifications"
          className="rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Info & Role */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
              {user?.name}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider mt-0.5">
              <Shield className="w-2.5 h-2.5" />
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={() => logout()}
            title="Log out of FleetFlow"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
