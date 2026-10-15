import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Layers,
  Sparkles,
  LifeBuoy,
  Megaphone,
  ClipboardList,
  Activity,
  Sliders,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { cn } from '../../lib/utils.js';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navSections = [
    {
      title: 'PLATFORM MANAGEMENT',
      items: [
        { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Companies', href: '/admin/companies', icon: Building2 },
        { label: 'Platform Users', href: '/admin/users', icon: Users },
      ],
    },
    {
      title: 'BILLING & PLANS',
      items: [
        { label: 'Subscription Plans', href: '/admin/plans', icon: CreditCard },
        { label: 'Subscriptions', href: '/admin/subscriptions', icon: Layers },
      ],
    },
    {
      title: 'INTELLIGENCE & METRICS',
      items: [
        { label: 'Platform Analytics', href: '/admin/analytics', icon: Activity },
        { label: 'AI/ML Telemetry', href: '/admin/ai-monitoring', icon: Sparkles },
      ],
    },
    {
      title: 'COMMUNICATIONS & SUPPORT',
      items: [
        { label: 'Support Tickets', href: '/admin/support', icon: LifeBuoy },
        { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      ],
    },
    {
      title: 'SYSTEM & GOVERNANCE',
      items: [
        { label: 'Audit Trail Logs', href: '/admin/audit-logs', icon: ClipboardList },
        { label: 'System Health', href: '/admin/health', icon: Activity },
        { label: 'Platform Settings', href: '/admin/settings', icon: Sliders },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-900/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">FleetFlow</span>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Super Admin Console</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={item.href === '/admin'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
                          isActive
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Switch to Company Workspace */}
          <div className="pt-2 border-t border-slate-800/80">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all group"
            >
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              <span>Switch to Tenant Workspace</span>
            </Link>
          </div>
        </div>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-rose-950 border border-rose-700/50 flex items-center justify-center text-rose-300 font-bold text-xs shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-rose-400 font-semibold truncate">SUPER ADMIN</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out of Platform Admin"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cluster Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/audit-logs"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors hidden sm:inline-block"
            >
              Audit Trail
            </Link>
            <Link
              to="/admin/health"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors hidden sm:inline-block"
            >
              System Health
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
