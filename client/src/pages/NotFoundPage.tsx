import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <FileQuestion className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">404 — Page Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The page or workspace module you are looking for does not exist or has moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link to="/">
            <Button leftIcon={<Home className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
