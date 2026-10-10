import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, RefreshCw, BarChart2, Package, Truck, Layers } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';

export const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Platform Analytics & Growth Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated longitudinal metrics, carrier registration trends, and operational activity.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Trends
        </button>
      </div>

      {loading || !analytics ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mb-2" />
          <p className="text-xs">Computing aggregated platform trends...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Carrier Growth */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Monthly Carrier Workspace Registrations
            </h2>

            {analytics.companyGrowth?.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6">No historical registration records available.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {analytics.companyGrowth.map((cg: any) => (
                  <div key={cg.month} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{cg.month}</span>
                    <p className="text-2xl font-black text-white mt-1">{cg.count}</p>
                    <span className="text-[10px] text-emerald-400 font-medium">New Companies</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operational Dispatch & Shipment Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Status Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-amber-400" />
                Dispatch Trips by Operational State
              </h2>
              {analytics.tripStats?.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6">No trip records found.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.tripStats.map((ts: any) => (
                    <div
                      key={ts._id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-200">{ts._id || 'UNASSIGNED'}</span>
                      <div className="text-right">
                        <span className="font-bold text-white">{ts.count} trips</span>
                        <p className="text-[10px] text-slate-400">
                          {Math.round(ts.totalDistance || 0).toLocaleString()} km logged
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipment Status Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-blue-400" />
                Shipment Volume Distribution
              </h2>
              {analytics.shipmentStats?.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6">No shipment records found.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.shipmentStats.map((ss: any) => (
                    <div
                      key={ss._id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-200">{ss._id}</span>
                      <div className="text-right">
                        <span className="font-bold text-white">{ss.count} orders</span>
                        <p className="text-[10px] text-slate-400">
                          {Math.round(ss.totalWeight || 0).toLocaleString()} kg gross weight
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
