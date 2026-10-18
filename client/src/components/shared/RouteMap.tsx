import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Clock, ShieldCheck, MapPin } from 'lucide-react';

interface RouteMapProps {
  origin?: { name: string; lat: number; lon: number } | null;
  destination?: { name: string; lat: number; lon: number } | null;
  routeCoordinates?: [number, number][];
  distanceKm?: number;
  durationMinutes?: number;
  className?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  origin,
  destination,
  routeCoordinates,
  distanceKm,
  durationMinutes,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on India [20.5937, 78.9629], zoom 5
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
      });

      // CartoDB Positron / OSM tiles for crisp modern look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add zoom control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Update Route and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers & polyline
    markersLayerRef.current?.clearLayers();
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const boundsPoints: [number, number][] = [];

    // Custom Origin Marker Icon
    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-route-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="position: absolute; width: 32px; height: 32px; background: rgba(16, 185, 129, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
              A
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon }).bindPopup(
        `<b>Start / Origin</b><br/>${origin.name}`
      );
      markersLayerRef.current?.addLayer(originMarker);
      boundsPoints.push([origin.lat, origin.lon]);
    }

    // Custom Destination Marker Icon
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-route-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="position: absolute; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
              B
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const destMarker = L.marker([destination.lat, destination.lon], { icon: destIcon }).bindPopup(
        `<b>Destination / End</b><br/>${destination.name}`
      );
      markersLayerRef.current?.addLayer(destMarker);
      boundsPoints.push([destination.lat, destination.lon]);
    }

    // Draw route polyline
    if (routeCoordinates && routeCoordinates.length > 0) {
      // Background glow polyline
      const glowPolyline = L.polyline(routeCoordinates, {
        color: '#6366f1',
        weight: 7,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });
      markersLayerRef.current?.addLayer(glowPolyline);

      // Active sharp polyline
      const activePolyline = L.polyline(routeCoordinates, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      markersLayerRef.current?.addLayer(activePolyline);
      routeLayerRef.current = activePolyline;

      // Fit bounds to route
      map.fitBounds(activePolyline.getBounds(), {
        padding: [45, 45],
        maxZoom: 14,
      });
    } else if (boundsPoints.length > 0) {
      if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 10);
      } else {
        const bounds = L.latLngBounds(boundsPoints.map((p) => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [origin, destination, routeCoordinates]);

  const formatDriveTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m} mins`;
    return `${hours}h ${m}m`;
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] z-0" />

      {/* Floating Modern HUD Header */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] pointer-events-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Navigation className="w-4 h-4 animate-spin-slow" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{origin ? origin.name.split(',')[0] : 'Origin'}</span>
                <span className="text-slate-400">➔</span>
                <span>{destination ? destination.name.split(',')[0] : 'Destination'}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                OSRM Indian National Highway Optimal Route
              </p>
            </div>
          </div>

          {(distanceKm !== undefined || durationMinutes !== undefined) && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 text-xs">
              {distanceKm !== undefined && (
                <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {distanceKm} KM
                </div>
              )}
              {durationMinutes !== undefined && durationMinutes > 0 && (
                <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{formatDriveTime(durationMinutes)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Status Pill */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white/80 text-[10px] flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Interactive Route View • Pan & Zoom Enabled</span>
        </div>
      </div>
    </div>
  );
};
