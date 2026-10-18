// Indian Hubs with pre-configured coordinates for instantaneous routing
export interface IndianLocation {
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
}

export const POPULAR_INDIAN_HUBS: IndianLocation[] = [
  { name: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { name: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Nagpur, Maharashtra', city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Nashik, Maharashtra', city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
  { name: 'New Delhi, Delhi', city: 'New Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Noida, Uttar Pradesh', city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.391 },
  { name: 'Gurgaon, Haryana', city: 'Gurgaon', state: 'Haryana', lat: 28.4595, lon: 77.0266 },
  { name: 'Bengaluru, Karnataka', city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { name: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Surat, Gujarat', city: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
  { name: 'Vadodara, Gujarat', city: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
  { name: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Jodhpur, Rajasthan', city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
  { name: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Kanpur, Uttar Pradesh', city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { name: 'Varanasi, Uttar Pradesh', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Indore, Madhya Pradesh', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { name: 'Bhopal, Madhya Pradesh', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { name: 'Chandigarh, Punjab/Haryana', city: 'Chandigarh', state: 'Punjab', lat: 30.7333, lon: 76.7794 },
  { name: 'Ludhiana, Punjab', city: 'Ludhiana', state: 'Punjab', lat: 30.901, lon: 75.8573 },
  { name: 'Coimbatore, Tamil Nadu', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { name: 'Kochi, Kerala', city: 'Ernakulam', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Patna, Bihar', city: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Bhubaneswar, Odisha', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
  { name: 'Guwahati, Assam', city: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
  { name: 'Visakhapatnam, Andhra Pradesh', city: 'Vishakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  { name: 'Vijayawada, Andhra Pradesh', city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.648 },
];

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lon]
  summary?: string;
}

export const routeService = {
  /**
   * Search for an Indian location by query string
   */
  async searchIndianLocation(query: string): Promise<IndianLocation[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // First search fast local Indian hubs
    const localMatches = POPULAR_INDIAN_HUBS.filter(
      (hub) =>
        hub.name.toLowerCase().includes(q) ||
        hub.city.toLowerCase().includes(q) ||
        hub.state.toLowerCase().includes(q)
    );

    if (localMatches.length >= 3 || q.length < 3) {
      return localMatches.slice(0, 6);
    }

    // Query Nominatim OpenStreetMap for any Indian town or landmark
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=6&q=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FleetFlow-Logistics-Platform/1.0',
        },
      });

      if (res.ok) {
        const results = await res.json();
        const onlineLocations: IndianLocation[] = results.map((r: any) => {
          const parts = r.display_name.split(',').map((p: string) => p.trim());
          const cityName = parts[0] || 'Unknown';
          const stateName = parts.length > 2 ? parts[parts.length - 2] : '';
          return {
            name: r.display_name,
            city: cityName,
            state: stateName,
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
          };
        });

        // Combine unique
        const combined = [...localMatches];
        for (const loc of onlineLocations) {
          if (!combined.some((c) => Math.abs(c.lat - loc.lat) < 0.01 && Math.abs(c.lon - loc.lon) < 0.01)) {
            combined.push(loc);
          }
        }
        return combined.slice(0, 6);
      }
    } catch (err) {
      console.warn('Nominatim geocoding error:', err);
    }

    return localMatches.slice(0, 6);
  },

  /**
   * Calculate driving route using OpenRouteService with OSRM fallback
   */
  async calculateRoute(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number }
  ): Promise<RouteResult> {
    const orsKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjRmOTA1NzlmNTBkMDQ0NjFiYTdhMmJjNTAzMWQzNmY2IiwiaCI6Im11cm11cjY0In0=';

    // 1. Try OpenRouteService (Highway & Heavy Logistics Directions)
    if (orsKey) {
      try {
        const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?start=${origin.lon},${origin.lat}&end=${destination.lon},${destination.lat}`;
        const res = await fetch(orsUrl, {
          headers: {
            'Authorization': orsKey,
            'Accept': 'application/json, application/geo+json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const summary = feature.properties?.summary;
            const distMeters = summary?.distance || 0;
            const durationSec = summary?.duration || 0;

            const distanceKm = Math.round((distMeters / 1000) * 10) / 10;
            const durationMinutes = Math.round(durationSec / 60);

            // GeoJSON coordinates are [lon, lat], Leaflet polyline expects [lat, lon]
            const coordinates: [number, number][] = feature.geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]]
            );

            return {
              distanceKm,
              durationMinutes,
              coordinates,
              summary: 'OpenRouteService Commercial Highway Route',
            };
          }
        }
      } catch (err) {
        console.warn('OpenRouteService request error, falling back to OSRM:', err);
      }
    }

    // 2. Fallback to OSRM
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMinutes = Math.round(route.duration / 60);

          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );

          return {
            distanceKm,
            durationMinutes,
            coordinates,
            summary: route.legs?.[0]?.summary || 'OSRM National Highway Route',
          };
        }
      }
    } catch (err) {
      console.warn('OSRM routing request failed, computing geodesic road estimate:', err);
    }

    // 3. Geodesic fallback with road curvature factor 1.28
    const distanceKm = Math.round(haversineDistance(origin, destination) * 1.28 * 10) / 10;
    const durationMinutes = Math.round((distanceKm / 55) * 60); // 55 km/h commercial average
    const coordinates: [number, number][] = [
      [origin.lat, origin.lon],
      [(origin.lat + destination.lat) / 2, (origin.lon + destination.lon) / 2],
      [destination.lat, destination.lon],
    ];

    return {
      distanceKm,
      durationMinutes,
      coordinates,
      summary: 'Direct Highway Estimate',
    };
  },
};

function haversineDistance(
  coord1: { lat: number; lon: number },
  coord2: { lat: number; lon: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
