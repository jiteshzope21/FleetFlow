import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service.js';

export function useDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, activityRes] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getActivity(),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (activityRes.success) setActivities(activityRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { overview, activities, loading, error, reload };
}
