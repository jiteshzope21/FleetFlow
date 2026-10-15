import React from 'react';
import { Outlet } from 'react-router-dom';
import { Truck, ShieldCheck, Cpu, ArrowUpRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.js';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Column: Visual branding and system capabilities */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden border-r border-slate-800/80">
        {/* Abstract background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#d97736_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* Glow orb */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-black text-xl shadow-lg shadow-brand-500/30">
              FF
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight">FleetFlow</span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Enterprise SaaS
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-brand-200">
            <Cpu className="w-3.5 h-3.5" />
            <span>Transport & Logistics Operating System</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Centralized fleet intelligence for modern transport companies.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Replace fragmented spreadsheets with enterprise-grade vehicle tracking, driver allocation,
            automated quotation estimation, and real-time operational financials.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Strict Multi-Tenancy</span>
              </div>
              <p className="text-[11px] text-slate-400">Total data isolation with company-scoped security.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                <Truck className="w-4 h-4 text-brand-400" />
                <span>End-to-End Fleet OS</span>
              </div>
              <p className="text-[11px] text-slate-400">Shipments, routes, trips, maintenance & invoices.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-8 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} FleetFlow Technologies</span>
          <span className="flex items-center gap-1 text-slate-300">
            Phase 1 Core Platform <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-12 relative">
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
