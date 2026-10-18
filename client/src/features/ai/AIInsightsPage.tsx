import React, { useEffect, useState, useRef } from 'react';
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
  MapPin,
  Navigation,
  ArrowRightLeft,
  Search,
  Compass,
  Zap,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ITripCostPrediction,
  IAIFleetInsights,
  IAIRecommendation,
  VehicleType,
  FuelType,
} from '../../types/index.js';
import { aiService } from '../../services/ai.service.js';
import { fuelService } from '../../services/fuel.service.js';
import {
  routeService,
  IndianLocation,
  POPULAR_INDIAN_HUBS,
  RouteResult,
} from '../../services/route.service.js';
import { RouteMap } from '../../components/shared/RouteMap.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { formatCurrency } from '../../lib/utils.js';

export const AIInsightsPage: React.FC = () => {
  // Input Mode: 'route' (Origin/Destination Map) or 'manual' (Direct KM)
  const [plannerMode, setPlannerMode] = useState<'route' | 'manual'>('route');

  // Route Planning States (India)
  const [originQuery, setOriginQuery] = useState<string>('Mumbai, Maharashtra');
  const [destQuery, setDestQuery] = useState<string>('Pune, Maharashtra');
  const [originLocation, setOriginLocation] = useState<IndianLocation>(POPULAR_INDIAN_HUBS[0]); // Mumbai
  const [destLocation, setDestLocation] = useState<IndianLocation>(POPULAR_INDIAN_HUBS[1]); // Pune
  const [originSuggestions, setOriginSuggestions] = useState<IndianLocation[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<IndianLocation[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState<boolean>(false);
  const [showDestDropdown, setShowDestDropdown] = useState<boolean>(false);

  // Routing Map Geometry & Metrics
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number>(195);
  const [calculatingRoute, setCalculatingRoute] = useState<boolean>(false);

  // Real-time Indian Fuel Price State (with 12h server caching)
  const [liveFuelInfo, setLiveFuelInfo] = useState<{
    price: number;
    city: string;
    matchedCity: string;
    cached: boolean;
    timestamp: string;
    isEstimate: boolean;
  } | null>(null);
  const [fetchingFuelPrice, setFetchingFuelPrice] = useState<boolean>(false);

  // Simulator inputs
  const [distanceKm, setDistanceKm] = useState<number>(148.6);
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(4500);
  const [vehicleType, setVehicleType] = useState<VehicleType>('TRUCK');
  const [fuelType, setFuelType] = useState<FuelType>('DIESEL');
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(90.2);

  // ML Prediction States
  const [predicting, setPredicting] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<ITripCostPrediction | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Insights & Recommendations States
  const [insights, setInsights] = useState<IAIFleetInsights | null>(null);
  const [recommendations, setRecommendations] = useState<IAIRecommendation[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [dismissSuccess, setDismissSuccess] = useState<string | null>(null);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Initial load
  useEffect(() => {
    loadInsightsAndRecommendations();
    // Compute initial route and fetch live fuel price
    calculateIndianRoute(originLocation, destLocation);
  }, []);

  // Fetch real-time fuel price using the Indian Fuel API backend proxy
  const fetchLiveFuelPrice = async (targetCity: string, fType: FuelType = fuelType) => {
    try {
      setFetchingFuelPrice(true);
      const data = await fuelService.getLiveFuelPrice(targetCity, fType);
      if (data && data.price) {
        setFuelPricePerLiter(data.price);
        setLiveFuelInfo({
          price: data.price,
          city: targetCity,
          matchedCity: data.matchedCity || targetCity,
          cached: data.cached,
          timestamp: data.timestamp,
          isEstimate: data.isEstimate || false,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch real-time fuel price:', err);
    } finally {
      setFetchingFuelPrice(false);
    }
  };

  // Compute Route and trigger ML inference
  const calculateIndianRoute = async (origin: IndianLocation, dest: IndianLocation) => {
    try {
      setCalculatingRoute(true);
      const routeData = await routeService.calculateRoute(
        { lat: origin.lat, lon: origin.lon },
        { lat: dest.lat, lon: dest.lon }
      );

      setDistanceKm(routeData.distanceKm);
      setRouteCoordinates(routeData.coordinates);
      setRouteDurationMinutes(routeData.durationMinutes);

      // Fetch live fuel price for origin city
      await fetchLiveFuelPrice(origin.city, fuelType);

      // Run prediction with updated distance
      runPredictionWithValues(routeData.distanceKm, fuelPricePerLiter, cargoWeightKg, vehicleType, fuelType);
    } catch (err) {
      console.warn('Route calculation error:', err);
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Handle Fuel Type change: auto-fetch new fuel type price
  const handleFuelTypeChange = (newFuelType: FuelType) => {
    setFuelType(newFuelType);
    const city = originLocation ? originLocation.city : 'Mumbai';
    fetchLiveFuelPrice(city, newFuelType);
  };

  const runPrediction = async () => {
    runPredictionWithValues(distanceKm, fuelPricePerLiter, cargoWeightKg, vehicleType, fuelType);
  };

  const runPredictionWithValues = async (
    dist: number,
    fuelPrice: number,
    weight: number,
    vType: VehicleType,
    fType: FuelType
  ) => {
    try {
      setPredicting(true);
      setPredictionError(null);
      const res = await aiService.predictTripCost({
        distanceKm: dist,
        cargoWeightKg: weight,
        vehicleType: vType,
        fuelType: fType,
        fuelPricePerLiter: fuelPrice,
      });
      setPrediction(res);
    } catch (err: any) {
      setPredictionError(err.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  // Location Autocomplete Handlers
  const handleOriginSearch = async (val: string) => {
    setOriginQuery(val);
    setShowOriginDropdown(true);
    if (val.trim().length > 1) {
      const results = await routeService.searchIndianLocation(val);
      setOriginSuggestions(results);
    } else {
      setOriginSuggestions(POPULAR_INDIAN_HUBS.slice(0, 5));
    }
  };

  const handleDestSearch = async (val: string) => {
    setDestQuery(val);
    setShowDestDropdown(true);
    if (val.trim().length > 1) {
      const results = await routeService.searchIndianLocation(val);
      setDestSuggestions(results);
    } else {
      setDestSuggestions(POPULAR_INDIAN_HUBS.slice(0, 5));
    }
  };

  const selectOrigin = (loc: IndianLocation) => {
    setOriginLocation(loc);
    setOriginQuery(loc.name);
    setShowOriginDropdown(false);
    calculateIndianRoute(loc, destLocation);
  };

  const selectDest = (loc: IndianLocation) => {
    setDestLocation(loc);
    setDestQuery(loc.name);
    setShowDestDropdown(false);
    calculateIndianRoute(originLocation, loc);
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const prevOrigin = originLocation;
    const prevOriginQuery = originQuery;
    setOriginLocation(destLocation);
    setOriginQuery(destQuery);
    setDestLocation(prevOrigin);
    setDestQuery(prevOriginQuery);
    calculateIndianRoute(destLocation, prevOrigin);
  };

  // Quick Pre-set Indian Corridors
  const selectQuickCorridor = (origName: string, destName: string) => {
    const orig = POPULAR_INDIAN_HUBS.find((h) => h.city.toLowerCase() === origName.toLowerCase()) || POPULAR_INDIAN_HUBS[0];
    const dest = POPULAR_INDIAN_HUBS.find((h) => h.city.toLowerCase() === destName.toLowerCase()) || POPULAR_INDIAN_HUBS[1];
    setOriginLocation(orig);
    setOriginQuery(orig.name);
    setDestLocation(dest);
    setDestQuery(dest.name);
    calculateIndianRoute(orig, dest);
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
            Real-time Indian highway route optimizer, live fuel prices, and ML haulage cost prediction.
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

      {/* PROACTIVE FLEET RECOMMENDATIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Proactive Fleet Recommendations ({recommendations.length})
          </h2>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              Fleet operations nominal. No critical maintenance or anomaly alerts triggered.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={getSeverityBadgeVariant(rec.severity)}>
                      {rec.category}
                    </Badge>
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

      {/* ======================================================== */}
      {/* REAL-TIME INDIAN ROUTE PLANNER & VISUAL MAP STUDIO       */}
      {/* ======================================================== */}
      <Card className="border-primary-500/30 overflow-hidden shadow-lg bg-gradient-to-b from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary-500" />
                India Logistics Route Optimizer & Visual Map
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select Indian Start and Destination hubs to view the optimal highway route, auto-calculate distance, and sync live fuel prices.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setPlannerMode('route')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  plannerMode === 'route'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                Route & Visual Map
              </button>
              <button
                type="button"
                onClick={() => setPlannerMode('manual')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  plannerMode === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Manual KM Input
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {plannerMode === 'route' && (
            <>
              {/* Origin / Destination Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Origin Input */}
                <div ref={originRef} className="relative md:col-span-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Start / Origin Hub (India)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600" />
                    <Input
                      type="text"
                      value={originQuery}
                      onChange={(e) => handleOriginSearch(e.target.value)}
                      onFocus={() => {
                        setShowOriginDropdown(true);
                        if (originSuggestions.length === 0) {
                          setOriginSuggestions(POPULAR_INDIAN_HUBS.slice(0, 5));
                        }
                      }}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="pl-9 pr-3 text-sm font-medium"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showOriginDropdown && originSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      <div className="p-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 border-b border-slate-100 dark:border-slate-800">
                        Suggested Indian Hubs
                      </div>
                      {originSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectOrigin(loc)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {loc.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                            {loc.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <div className="md:col-span-2 flex justify-center pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSwapLocations}
                    title="Swap Origin and Destination"
                    className="rounded-full w-9 h-9 p-0 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-950/40 border-slate-300 dark:border-slate-700"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </Button>
                </div>

                {/* Destination Input */}
                <div ref={destRef} className="relative md:col-span-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Destination / End Hub (India)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-rose-500" />
                    <Input
                      type="text"
                      value={destQuery}
                      onChange={(e) => handleDestSearch(e.target.value)}
                      onFocus={() => {
                        setShowDestDropdown(true);
                        if (destSuggestions.length === 0) {
                          setDestSuggestions(POPULAR_INDIAN_HUBS.slice(0, 5));
                        }
                      }}
                      placeholder="e.g. Pune, Maharashtra"
                      className="pl-9 pr-3 text-sm font-medium"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      <div className="p-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 border-b border-slate-100 dark:border-slate-800">
                        Suggested Indian Hubs
                      </div>
                      {destSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectDest(loc)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {loc.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                            {loc.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fast Corridor Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Popular Corridors:
                </span>
                {[
                  { label: 'Mumbai ➔ Pune', orig: 'Mumbai', dest: 'Pune' },
                  { label: 'Delhi ➔ Jaipur', orig: 'New Delhi', dest: 'Jaipur' },
                  { label: 'Bengaluru ➔ Chennai', orig: 'Bangalore', dest: 'Chennai' },
                  { label: 'Delhi ➔ Mumbai', orig: 'New Delhi', dest: 'Mumbai' },
                  { label: 'Hyderabad ➔ Vijayawada', orig: 'Hyderabad', dest: 'Vijayawada' },
                  { label: 'Ahmedabad ➔ Surat', orig: 'Ahmedabad', dest: 'Surat' },
                ].map((corridor, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectQuickCorridor(corridor.orig, corridor.dest)}
                    className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/40 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {corridor.label}
                  </button>
                ))}
              </div>

              {/* Interactive Visual Route Map */}
              <div className="relative pt-2">
                <RouteMap
                  origin={originLocation ? { name: originLocation.name, lat: originLocation.lat, lon: originLocation.lon } : null}
                  destination={destLocation ? { name: destLocation.name, lat: destLocation.lat, lon: destLocation.lon } : null}
                  routeCoordinates={routeCoordinates}
                  distanceKm={distanceKm}
                  durationMinutes={routeDurationMinutes}
                  className="h-[380px]"
                />

                {calculatingRoute && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-[1500]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Computing Highway Path & Distance...
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Real-time Indian Fuel Price Badge Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <Fuel className="w-4 h-4" />
              </span>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    Live {fuelType} Price in {liveFuelInfo?.matchedCity || originLocation?.city || 'India'}:
                  </span>
                  <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    ₹{fuelPricePerLiter.toFixed(2)} / Liter
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Source: Indian Fuel API</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {liveFuelInfo?.cached ? '⚡ 12h Server Cache Active (Quota Preserved)' : '✓ Real-time Live Price'}
                  </span>
                  {liveFuelInfo?.timestamp && (
                    <>
                      <span>•</span>
                      <span>Updated: {new Date(liveFuelInfo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveFuelPrice(originLocation?.city || 'Mumbai', fuelType)}
              disabled={fetchingFuelPrice}
              className="text-xs flex items-center gap-1.5 h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingFuelPrice ? 'animate-spin' : ''}`} />
              Sync Live Fuel Price
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* INTERACTIVE TRIP COST PREDICTION SIMULATOR               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-500" />
                Trip Cost ML Predictor Simulator
              </CardTitle>
              <p className="text-xs text-slate-500">
                Machine learning model utilizing highway distance, live fuel price, and gross payload weight.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Trip Distance (KM)
                  </label>
                  {plannerMode === 'route' && (
                    <span className="text-[11px] text-primary-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Auto-calculated from Route
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.1"
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
                    onChange={(e) => handleFuelTypeChange(e.target.value as FuelType)}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fuel Price (INR / Liter)
                  </label>
                  <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                    <Fuel className="w-3 h-3" /> Live Synced
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.01"
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
                <span className="text-slate-500">Monitored Units:</span>
                <span className="font-bold">{insights.maintenance.monitored_vehicles} Vehicles</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Overdue Service:</span>
                <span className="font-bold text-rose-500">{insights.maintenance.overdue_count} Overdue</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Due Soon (Next 7-14d):</span>
                <span className="font-bold text-amber-500">{insights.maintenance.due_soon_count} Due Soon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Operational Fleet Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Health Index:</span>
                <span className="font-bold text-emerald-600 uppercase">{insights.operational.operating_health_index}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Fleet Utilization:</span>
                <span className="font-bold">{insights.operational.fleet_utilization_percent}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Shipment Completion:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {insights.operational.shipment_completion_percent}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
