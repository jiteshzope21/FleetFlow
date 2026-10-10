import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    status: string;
    storageType?: string;
    isPersistent?: boolean;
  } | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.data || []);
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        if (res.data?.data?.database) {
          setDbStatus(res.data.data.database);
        }
      } catch {
        setDbStatus({ connected: false, status: 'offline', storageType: 'disconnected', isPersistent: false });
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
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            dbStatus?.isPersistent
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : dbStatus?.connected
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
          title={
            dbStatus?.isPersistent
              ? 'Persistent MongoDB Atlas Cluster Connected'
              : dbStatus?.connected
              ? 'Ephemeral In-Memory Database (Data resets upon server restart)'
              : 'Database Disconnected'
          }
        >
          {dbStatus?.isPersistent ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : dbStatus?.connected ? (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>
            {dbStatus?.isPersistent
              ? 'Atlas Persistent'
              : dbStatus?.connected
              ? 'In-Memory (Ephemeral Dev)'
              : 'DB Offline'}
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

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) fetchNotifications();
            }}
            aria-label="Notifications"
            className="rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">In-App Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-brand-600 font-bold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl text-xs space-y-0.5 border ${
                        n.isRead
                          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40 opacity-70'
                          : 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/40'
                      }`}
                    >
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Super Admin Quick Link */}
        {user?.role === 'SUPER_ADMIN' && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md shadow-rose-900/30 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </Link>
        )}

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
