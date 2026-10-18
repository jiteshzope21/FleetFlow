import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Clock,
  ShieldCheck,
  Mountain,
  Map as MapIcon,
  Globe,
  Lock,
  Unlock,
  Maximize2,
} from 'lucide-react';

interface RouteMapProps {
  origin?: { name: string; lat: number; lon: number } | null;
  destination?: { name: string; lat: number; lon: number } | null;
  routeCoordinates?: [number, number][];
  distanceKm?: number;
  durationMinutes?: number;
  className?: string;
}

type MapLayerType = 'terrain' | 'streets' | 'satellite';

const MAP_LAYERS = {
  // Rich Topography & Terrain with elevation relief shading, mountains, rivers, and roads
  terrain: {
    name: 'Terrain Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 19,
  },
  // Full-color OpenStreetMap Road Network
  streets: {
    name: 'OpenStreetMap Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  // High-resolution Satellite Imagery
  satellite: {
    name: 'Satellite Aerial',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
};

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
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('terrain');
  // Scroll zoom lock state: true = scroll wheel will NOT zoom map (prevents accidental zoom while scrolling page)
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on India [20.5937, 78.9629], zoom 5
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
        // Disable scroll wheel zoom by default so user can scroll page smoothly without map capturing scroll
        scrollWheelZoom: false,
      });

      // Add default layer (Terrain)
      const initialLayerConfig = MAP_LAYERS.terrain;
      const tileLayer = L.tileLayer(initialLayerConfig.url, {
        attribution: initialLayerConfig.attribution,
        maxZoom: initialLayerConfig.maxZoom,
      }).addTo(map);

      currentTileLayerRef.current = tileLayer;

      // Add zoom control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      routeLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Repeated invalidateSize to prevent partial or blank tile rendering
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 250);
    const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Handle Scroll Zoom Lock Toggle
  const toggleLock = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isLocked) {
      map.scrollWheelZoom.enable();
      setIsLocked(false);
    } else {
      map.scrollWheelZoom.disable();
      setIsLocked(true);
    }
  };

  // Re-fit View to Route
  const handleFitRoute = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeCoordinates && routeCoordinates.length > 0) {
      const polyline = L.polyline(routeCoordinates);
      map.fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 14 });
    } else if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      map.fitBounds(bounds, { padding: [55, 55] });
    }
  };

  // Handle Layer Switch
  const switchLayer = (layerType: MapLayerType) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const config = MAP_LAYERS[layerType];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);

    currentTileLayerRef.current = newLayer;
    setActiveLayer(layerType);
  };

  // Update Route Polyline and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers & polylines
    markersLayerRef.current?.clearLayers();
    routeLayerGroupRef.current?.clearLayers();

    const boundsPoints: [number, number][] = [];

    // Custom Origin Marker Icon
    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-route-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; background: #059669; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2.5px solid white;">
              A
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon }).bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <b style="color: #059669;">● Start / Origin Hub</b><br/>${origin.name}
        </div>`
      );
      markersLayerRef.current?.addLayer(originMarker);
      boundsPoints.push([origin.lat, origin.lon]);
    }

    // Custom Destination Marker Icon
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-route-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; background: rgba(225, 29, 72, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; background: #e11d48; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2.5px solid white;">
              B
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const destMarker = L.marker([destination.lat, destination.lon], { icon: destIcon }).bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <b style="color: #e11d48;">● Destination / End Hub</b><br/>${destination.name}
        </div>`
      );
      markersLayerRef.current?.addLayer(destMarker);
      boundsPoints.push([destination.lat, destination.lon]);
    }

    // Draw route polyline
    if (routeCoordinates && routeCoordinates.length > 0) {
      // Background Glow
      const glowPolyline = L.polyline(routeCoordinates, {
        color: '#f97316',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeLayerGroupRef.current?.addLayer(glowPolyline);

      // Main Route Polyline (Vibrant and clear across all terrains)
      const mainPolyline = L.polyline(routeCoordinates, {
        color: '#c2410c',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeLayerGroupRef.current?.addLayer(mainPolyline);

      // Fit map bounds to entire route
      map.fitBounds(mainPolyline.getBounds(), {
        padding: [50, 50],
        maxZoom: 14,
      });
    } else if (boundsPoints.length > 0) {
      if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 10);
      } else {
        const bounds = L.latLngBounds(boundsPoints.map((p) => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [55, 55] });
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
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-lg ${className}`}>
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] z-0" />

      {/* Top Floating HUD: Route Details & Layer Switcher & Lock Control */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Route Info Badge */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-2.5 pointer-events-auto">
          <span className="p-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Navigation className="w-4 h-4" />
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{origin ? origin.name.split(',')[0] : 'Origin'}</span>
              <span className="text-primary-500 font-extrabold">➔</span>
              <span>{destination ? destination.name.split(',')[0] : 'Destination'}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>OpenRouteService Highway Optimal</span>
              {(distanceKm !== undefined || durationMinutes !== undefined) && (
                <>
                  <span>•</span>
                  {distanceKm !== undefined && (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {distanceKm} KM
                    </span>
                  )}
                  {durationMinutes !== undefined && durationMinutes > 0 && (
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      (~{formatDriveTime(durationMinutes)})
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Layer Switcher + Scroll Zoom Lock + Re-center */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Scroll Lock Button */}
          <button
            type="button"
            onClick={toggleLock}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md shadow-md border transition-all flex items-center gap-1.5 ${
              isLocked
                ? 'bg-amber-500/90 hover:bg-amber-500 text-white border-amber-400/50 shadow-amber-500/20'
                : 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-emerald-400/50 shadow-emerald-500/20'
            }`}
            title={
              isLocked
                ? 'Map scroll zoom is locked (page scroll remains uninterrupted). Click to unlock mouse wheel zoom.'
                : 'Map scroll zoom is active (wheel zooms map). Click to lock position.'
            }
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Scroll Lock ON</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Zoom Unlocked</span>
              </>
            )}
          </button>

          {/* Re-center / Fit Route Button */}
          <button
            type="button"
            onClick={handleFitRoute}
            className="p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md transition-colors"
            title="Re-center & Fit Optimal Route"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Visual Map Perspective / Terrain Switcher */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-1">
            <button
              type="button"
              onClick={() => switchLayer('terrain')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeLayer === 'terrain'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Terrain, elevation relief, topography, hills, rivers and roads"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terrain Topo</span>
            </button>

            <button
              type="button"
              onClick={() => switchLayer('streets')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeLayer === 'streets'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="OpenStreetMap high-contrast street and highway network"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Streets</span>
            </button>

            <button
              type="button"
              onClick={() => switchLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeLayer === 'satellite'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Satellite photorealistic aerial imagery from space"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Satellite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Floating Legend / Status Pill */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[10px] flex items-center gap-2 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>India Freight Corridor • {isLocked ? 'Page Scrolling Safe (Locked)' : 'Map Zoom Active'}</span>
        </div>
      </div>
    </div>
  );
};
