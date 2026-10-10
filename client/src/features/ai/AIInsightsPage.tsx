import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Fuel,
  Wrench,
  ShieldAlert,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ITripCostPrediction,
  IAIFleetInsights,
  IAIRecommendation,
  VehicleType,
  FuelType,
} from '../../types/index.js';
import { aiService } from '../../services/ai.service.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { formatCurrency } from '../../lib/utils.js';

export const AIInsightsPage: React.FC = () => {
  // Simulator inputs
  const [distanceKm, setDistanceKm] = useState<number>(350);
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(4500);
  const [vehicleType, setVehicleType] = useState<VehicleType>('TRUCK');
  const [fuelType, setFuelType] = useState<FuelType>('DIESEL');
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(92.5);

  // States
  const [predicting, setPredicting] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<ITripCostPrediction | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const [insights, setInsights] = useState<IAIFleetInsights | null>(null);
  const [recommendations, setRecommendations] = useState<IAIRecommendation[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [dismissSuccess, setDismissSuccess] = useState<string | null>(null);

  const loadInsightsAndRecommendations = async () => {
    try {
      setLoadingInsights(true);
      const [insightsRes, recsRes] = await Promise.all([
        aiService.getFleetInsights(),
        aiService.getRecommendations(),
      ]);
      setInsights(insightsRes);
      setRecommendations(recsRes.recommendations || []);
    } catch (err: any) {
      setInsightsError(err.message || 'Failed to load AI analytics');
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadInsightsAndRecommendations();
    runPrediction();
  }, []);

  const runPrediction = async () => {
    try {
      setPredicting(true);
      setPredictionError(null);
      const res = await aiService.predictTripCost({
        distanceKm,
        cargoWeightKg,
        vehicleType,
        fuelType,
        fuelPricePerLiter,
      });
      setPrediction(res);
    } catch (err: any) {
      setPredictionError(err.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleDismissRecommendation = async (id: string) => {
    try {
      await aiService.dismissRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      setDismissSuccess('Recommendation acknowledged and archived.');
    } catch (err: any) {
      setPredictionError(err.message || 'Failed to dismiss recommendation');
    }
  };

  const getSeverityBadgeVariant = (severity: string): 'danger' | 'warning' | 'info' | 'success' => {
    switch (severity) {
      case 'DANGER':
        return 'danger';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Fleet Intelligence' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Fleet Intelligence & Forecasting
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Machine learning cost estimators, proactive maintenance alerts, and telemetry insights.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadInsightsAndRecommendations}
          disabled={loadingInsights}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loadingInsights ? 'animate-spin' : ''}`} />
          Refresh Insights
        </Button>
      </div>

      {dismissSuccess && (
        <Alert variant="success">
          {dismissSuccess}
        </Alert>
      )}

      {insightsError && (
        <Alert variant="error">
          {insightsError}
        </Alert>
      )}

      {/* ACTIONABLE AI RECOMMENDATIONS BANNER */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          Proactive Fleet Recommendations ({recommendations.length})
        </h2>

        {recommendations.length === 0 ? (
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Fleet Operating Smoothly
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  No active anomalies, overdue maintenance tasks, or delayed deliveries detected.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(rec.severity)}>
                        {rec.severity}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {rec.category}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissRecommendation(rec.id)}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Dismiss
                    </Button>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rec.explanation}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      Action: {rec.suggested_action}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* INTERACTIVE TRIP COST PREDICTION SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-500" />
                Trip Cost ML Predictor Simulator
              </CardTitle>
              <p className="text-xs text-slate-500">
                Test the Gradient Boosting Regressor or deterministic logistics model in real time.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Trip Distance (KM)
                </label>
                <Input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Cargo Weight (KG)
                </label>
                <Input
                  type="number"
                  value={cargoWeightKg}
                  onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    aria-label="Vehicle Type for Simulation"
                    className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  >
                    <option value="TRUCK">Truck</option>
                    <option value="TRAILER">Trailer</option>
                    <option value="VAN">Van</option>
                    <option value="TANKER">Tanker</option>
                    <option value="CONTAINER">Container</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Fuel Type
                  </label>
                  <select
                    aria-label="Fuel Type for Simulation"
                    className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Fuel Price (INR / Liter)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={fuelPricePerLiter}
                  onChange={(e) => setFuelPricePerLiter(Number(e.target.value))}
                />
              </div>

              <Button
                onClick={runPrediction}
                disabled={predicting}
                className="w-full flex items-center justify-center gap-2 mt-4"
              >
                <Sparkles className="w-4 h-4" />
                {predicting ? 'Computing Inference...' : 'Predict Operating Cost'}
              </Button>

              {predictionError && (
                <p className="text-xs text-rose-500 text-center">{predictionError}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PREDICTION RESULTS PANEL */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Inference Output & Breakdown</CardTitle>
                  <p className="text-xs text-slate-500">
                    Transparent financial forecast generated for {distanceKm} km haulage.
                  </p>
                </div>
                {prediction && (
                  <Badge variant="success">
                    {prediction.model_version}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-4 flex-1 space-y-4">
              {prediction ? (
                <>
                  <div className="bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent p-4 rounded-xl border border-primary-500/20">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      Estimated Trip Operating Cost
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(prediction.predicted_cost)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (Range: {formatCurrency(prediction.confidence_interval.lower_bound)} – {formatCurrency(prediction.confidence_interval.upper_bound)})
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">Fuel Cost</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(prediction.cost_breakdown.fuel_cost)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">Tolls & Taxes</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(prediction.cost_breakdown.toll_charges)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">Driver Pay</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(prediction.cost_breakdown.driver_allowance)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 block">Maintenance</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(prediction.cost_breakdown.maintenance_reserves)}
                      </span>
                    </div>
                  </div>

                  {/* Explainability bullets */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary-500" />
                      Model Explainability & Key Drivers
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {prediction.explainability.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  Run simulation to view AI cost breakdown.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TELEMETRY & FLEET OPERATIONAL INSIGHTS */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-500" />
                Fuel Efficiency Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Fleet Average Mileage:</span>
                <span className="font-bold">{insights.fuel.estimated_average_efficiency_kmpl} KM / L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Monitored Vehicles:</span>
                <span className="font-bold">{insights.fuel.analyzed_vehicles} Units</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Potential Eco-Savings:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(insights.fuel.savings_potential_inr)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                Maintenance Risk Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Overdue Service Alerts:</span>
                <span className="font-bold text-rose-500">{insights.maintenance.overdue_count} Vehicles</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Upcoming Due Soon:</span>
                <span className="font-bold text-amber-500">{insights.maintenance.due_soon_count} Vehicles</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Monitored Vehicles:</span>
                <span className="font-bold text-emerald-600">{insights.maintenance.monitored_vehicles} Units</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Operational Dispatch Velocity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Fleet Active Utilization:</span>
                <span className="font-bold">{insights.operational.fleet_utilization_percent}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Trip Completion Rate:</span>
                <span className="font-bold text-emerald-600">{insights.operational.shipment_completion_percent}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">System Health:</span>
                <span className="font-bold text-emerald-600">{insights.operational.operating_health_index}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
