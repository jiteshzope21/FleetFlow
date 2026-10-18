import { ENV } from '../../config/env.js';

interface FuelPriceEntry {
  city: string;
  price: string;
  change: string;
}

interface CacheItem {
  data: FuelPriceEntry[];
  timestamp: number;
}

// 12 hours in milliseconds - Indian fuel prices are updated once daily at 6:00 AM IST
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// In-memory cache by fuel type
const priceCache: Map<string, CacheItem> = new Map();
let cachedCities: { name: string; value: string }[] | null = null;
let citiesCacheTimestamp = 0;

// Common Indian city name aliases/synonyms
const CITY_ALIASES: Record<string, string> = {
  bengaluru: 'bangalore',
  gurugram: 'gurgaon',
  bombay: 'mumbai',
  calcutta: 'kolkata',
  madras: 'chennai',
  prayagraj: 'allahabad',
  varanasi: 'varanasi',
  banaras: 'varanasi',
  kashi: 'varanasi',
  trivandrum: 'trivandrum',
  thiruvananthapuram: 'trivandrum',
  cochin: 'ernakulam',
  kochi: 'ernakulam',
  baroda: 'vadodara',
  mysuru: 'mysore',
  belagavi: 'belgaum',
  hubballi: 'dharwad',
  hubli: 'dharwad',
  vizag: 'vishakhapatnam',
  visakhapatnam: 'vishakhapatnam',
  pondicherry: 'pondicherry',
  puducherry: 'pondicherry',
};

// Fallback baseline averages in India if network error or quota exceeded
const BASELINE_PRICES: Record<string, number> = {
  diesel: 91.5,
  petrol: 104.2,
  cng: 85.0,
  electric: 9.5, // INR per kWh equivalent
};

export class LiveFuelService {
  /**
   * Fetch live prices for a specific fuel type across all Indian cities with 12h caching
   */
  static async fetchAllPricesForFuelType(rawFuelType: string): Promise<FuelPriceEntry[]> {
    const fuelType = (rawFuelType || 'diesel').toLowerCase().trim();
    const normalizedType = fuelType === 'petrol' || fuelType === 'gasoline' ? 'petrol' : 'diesel';

    const cached = priceCache.get(normalizedType);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
      return cached.data;
    }

    const apiKey = ENV.INDIAN_FUEL_API_KEY;
    if (!apiKey) {
      throw new Error('INDIAN_FUEL_API_KEY is not configured in server environment.');
    }

    try {
      const url = `https://fuel.indianapi.in/live_fuel_price?fuel_type=${normalizedType}&location_type=city`;
      const response = await fetch(url, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[LiveFuelService] Indian API responded with ${response.status}: ${errText}`);
        // If we have stale cache, serve it rather than failing
        if (cached && cached.data.length > 0) {
          return cached.data;
        }
        throw new Error(`Fuel API request failed with status ${response.status}`);
      }

      const data = (await response.json()) as FuelPriceEntry[];
      if (Array.isArray(data) && data.length > 0) {
        priceCache.set(normalizedType, {
          data,
          timestamp: now,
        });
        return data;
      }

      if (cached && cached.data.length > 0) {
        return cached.data;
      }
      return [];
    } catch (err: any) {
      console.error('[LiveFuelService] Error fetching live prices:', err.message);
      if (cached && cached.data.length > 0) {
        return cached.data;
      }
      throw err;
    }
  }

  /**
   * Fetch live fuel price for a specific city and fuel type
   */
  static async getPriceForCity(cityName: string, rawFuelType: string): Promise<{
    city: string;
    matchedCity: string;
    fuelType: string;
    price: number;
    currency: string;
    unit: string;
    cached: boolean;
    timestamp: string;
    isEstimate: boolean;
  }> {
    const fuelType = (rawFuelType || 'diesel').toLowerCase().trim();
    const cleanCity = (cityName || '').toLowerCase().trim().replace(/[^\w\s]/g, '');

    // Resolve alias if present
    const resolvedCity = CITY_ALIASES[cleanCity] || cleanCity;

    let prices: FuelPriceEntry[] = [];
    let isCached = false;

    try {
      const cached = priceCache.get(fuelType === 'petrol' ? 'petrol' : 'diesel');
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        isCached = true;
      }
      prices = await this.fetchAllPricesForFuelType(fuelType);
    } catch (err: any) {
      console.warn('[LiveFuelService] Falling back to baseline price due to API error:', err.message);
      const fallbackPrice = BASELINE_PRICES[fuelType] || 92.0;
      return {
        city: cityName,
        matchedCity: 'National Average',
        fuelType: fuelType.toUpperCase(),
        price: fallbackPrice,
        currency: 'INR',
        unit: 'INR / Liter',
        cached: false,
        timestamp: new Date().toISOString(),
        isEstimate: true,
      };
    }

    // Try finding exact match
    let match = prices.find((p) => p.city.toLowerCase() === resolvedCity);

    // If no exact match, try matching city name containing target or target containing city name
    if (!match) {
      match = prices.find((p) => {
        const c = p.city.toLowerCase();
        return c.includes(resolvedCity) || resolvedCity.includes(c);
      });
    }

    if (match && !isNaN(parseFloat(match.price))) {
      return {
        city: cityName,
        matchedCity: match.city,
        fuelType: fuelType.toUpperCase(),
        price: parseFloat(match.price),
        currency: 'INR',
        unit: 'INR / Liter',
        cached: isCached,
        timestamp: new Date().toISOString(),
        isEstimate: false,
      };
    }

    // If city is not listed, find state capital or general average
    const defaultCity = prices.find((p) => p.city.toLowerCase() === 'delhi' || p.city.toLowerCase() === 'mumbai') || prices[0];
    const fallbackPrice = defaultCity ? parseFloat(defaultCity.price) : (BASELINE_PRICES[fuelType] || 92.0);

    return {
      city: cityName,
      matchedCity: defaultCity ? `${defaultCity.city} (Benchmark)` : 'National Average',
      fuelType: fuelType.toUpperCase(),
      price: fallbackPrice,
      currency: 'INR',
      unit: 'INR / Liter',
      cached: isCached,
      timestamp: new Date().toISOString(),
      isEstimate: true,
    };
  }

  /**
   * Get supported cities list (cached for 24h)
   */
  static async getCitiesList(): Promise<{ name: string; value: string }[]> {
    const now = Date.now();
    if (cachedCities && now - citiesCacheTimestamp < CACHE_TTL_MS * 2) {
      return cachedCities;
    }

    const apiKey = ENV.INDIAN_FUEL_API_KEY;
    if (!apiKey) {
      return [];
    }

    try {
      const response = await fetch('https://fuel.indianapi.in/cities', {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const list = (await response.json()) as { name: string; value: string }[];
        if (Array.isArray(list) && list.length > 0) {
          cachedCities = list;
          citiesCacheTimestamp = now;
          return list;
        }
      }
    } catch (err: any) {
      console.warn('[LiveFuelService] Error loading cities list:', err.message);
    }

    return cachedCities || [];
  }
}
