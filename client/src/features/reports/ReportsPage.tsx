import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Navigation,
  Truck,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { IOperationalSummary } from '../../types/index.js';
import { reportService } from '../../services/report.service.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { formatCurrency } from '../../lib/utils.js';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<IOperationalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingShipments, setExportingShipments] = useState(false);
  const [exportingTrips, setExportingTrips] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getSummary();
      setSummary(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load operational report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportShipments = async () => {
    try {
      setExportingShipments(true);
      await reportService.downloadShipmentsCsv();
      setExportSuccess('Shipments CSV generated and downloaded securely.');
    } catch (err: any) {
      setError(err.message || 'Failed to export shipments CSV');
    } finally {
      setExportingShipments(false);
    }
  };

  const handleExportTrips = async () => {
    try {
      setExportingTrips(true);
      await reportService.downloadTripsCsv();
      setExportSuccess('Trips CSV generated and downloaded securely.');
    } catch (err: any) {
      setError(err.message || 'Failed to export trips CSV');
    } finally {
      setExportingTrips(false);
    }
  };

  const totalRevenue = summary?.financials?.totalRevenue || 0;
  const actualCosts = summary?.financials?.actualCost || 0;
  const grossMargin = summary?.financials?.grossMargin || 0;
  const marginPercent = summary?.financials?.marginPercent || 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports & Analytics' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Financial Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time fleet financial accounting, margins, trip performance, and spreadsheet exports.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSummary}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {exportSuccess && (
        <Alert variant="success">
          {exportSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Freight Revenue
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalRevenue)}
              </p>
              <span className="text-xs text-slate-500">Agreed order values</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actual Operating Costs
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(actualCosts)}
              </p>
              <span className="text-xs text-slate-500">Fuel, tolls, & allowances</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gross Transport Margin
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(grossMargin)}
              </p>
              <span className="text-xs text-emerald-600 font-medium">
                {marginPercent}% Profit Margin
              </span>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-950/40 rounded-xl text-primary-600">
              <Percent className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed Trips
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary?.trips?.completed || 0}
              </p>
              <span className="text-xs text-slate-500">
                {summary?.shipments?.total || 0} Total Shipments
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <Navigation className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Export Centre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-500" />
            Export Data Center
          </CardTitle>
          <p className="text-xs text-slate-500">
            Download company-scoped CSV spreadsheets with automated formula injection sanitization.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Shipment Bookings Register
                  </h4>
                  <p className="text-xs text-slate-500">
                    All customer shipments, status, cargo, weights, pricing, and POD notes.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportShipments}
                disabled={exportingShipments}
                className="flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {exportingShipments ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Trips & Operational Costs Register
                  </h4>
                  <p className="text-xs text-slate-500">
                    Assigned vehicles, drivers, distance, fuel expenses, tolls, and margin.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTrips}
                disabled={exportingTrips}
                className="flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {exportingTrips ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
