import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { UserRole } from '../types/index.js';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-[#0b2347] mb-1">
            <img src="/logo.png" alt="FleetFlow Logo" className="h-full w-full object-cover" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Initializing FleetFlow Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (allowedRoles && allowedRoles.includes('SUPER_ADMIN')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
