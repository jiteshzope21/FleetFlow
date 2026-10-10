import React from 'react';
import { Card, CardContent } from '../ui/Card.js';
import { Skeleton } from '../ui/Skeleton.js';
import { cn } from '../../lib/utils.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
  badge,
  isLoading = false,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className={cn('p-2.5 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {value}
            </h4>
          )}
          {badge}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
