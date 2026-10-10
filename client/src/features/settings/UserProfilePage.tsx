import React from 'react';
import { User, Mail, Shield, Building2, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { formatDateTime, formatDate } from '../../lib/utils.js';

export const UserProfilePage: React.FC = () => {
  const { user, company } = useAuth();

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={[{ label: 'My Account' }]} />

      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          User Account Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personal identity, active role credentials, and session details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Personal account information stored on FleetFlow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {user?.role?.replace('_', ' ')}
                  </Badge>
                  <Badge variant="success" size="sm">
                    {user?.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Email Address</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{user?.email}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Phone</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{user?.phone || 'Not configured'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Associated Company</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{company?.name}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Last Session Login</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{formatDateTime(user?.lastLoginAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <CardTitle>Role Permissions</CardTitle>
            </div>
            <CardDescription>Privileges granted to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-300">
                Workspace multi-tenant isolation active
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-300">
                Encrypted password authentication (bcrypt)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-300">
                Scoped to company tenant ID: <strong>{company?.slug}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
