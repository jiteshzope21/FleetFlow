import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-xl shadow-rose-500/10">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">403 — Access Denied</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You do not possess the required role permissions to access this feature or resource.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link to="/">
            <Button leftIcon={<Home className="w-4 h-4" />}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
