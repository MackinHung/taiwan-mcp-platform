import type { ArcGisResponse, TaichungApiResponse, NlscFeatureCollection } from './types.js';

const FETCH_TIMEOUT_MS = 10_000;

// --- API Base URLs ---

export const API_URLS = {
  TAIPEI_ARCGIS: 'https://www.historygis.udd.taipei.gov.tw/arcgis/rest/services/Urban/EMap/MapServer',
  TAICHUNG_API: 'https://datacenter.taichung.gov.tw/swagger/OpenData',
  NLSC_WMS: 'http://maps.nlsc.gov.tw/S_Maps/wms',
  NLSC_WFS: 'https://maps.nlsc.gov.tw/S_Maps/wfs',
} as const;

// --- ArcGIS Layer IDs ---

export const ARCGIS_LAYERS = {
  ZONING: 89,
  PUBLIC_FACILITIES: 90,
  URBAN_RENEWAL: 91,
} as const;

// --- Taiwan bounding box for coordinate validation ---

export const TAIWAN_BOUNDS = {
  minLat: 21.5,
  maxLat: 26.5,
  minLng: 119.0,
  maxLng: 122.5,
} as const;

// --- City coordinate ranges for routing ---

export const CITY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  '臺北市': { minLat: 24.96, maxLat: 25.21, minLng: 121.45, maxLng: 121.67 },
  '臺中市': { minLat: 24.00, maxLat: 24.45, minLng: 120.45, maxLng: 121.00 },
  '高雄市': { minLat: 22.47, maxLat: 23.47, minLng: 120.15, maxLng: 120.85 },
  '新北市': { minLat: 24.67, maxLat: 25.30, minLng: 121.28, maxLng: 122.01 },
  '桃園市': { minLat: 24.72, maxLat: 25.12, minLng: 121.08, maxLng: 121.45 },
  '臺南市': { minLat: 22.88, maxLat: 23.41, minLng: 120.05, maxLng: 120.65 },
};

/**
 * Validate that coordinates are within Taiwan's bounding box
 */
export function isWithinTaiwan(latitude: number, longitude: number): boolean {
  return (
    latitude >= TAIWAN_BOUNDS.minLat &&
    latitude <= TAIWAN_BOUNDS.maxLat &&
    longitude >= TAIWAN_BOUNDS.minLng &&
    longitude <= TAIWAN_BOUNDS.maxLng
  );
}

/**
 * Normalize city name aliases (台 -> 臺)
 */
export function normalizeCity(city: string): string {
  return city.replace(/台/g, '臺');
}

/**
 * Detect city from coordinates
 */
export function detectCityFromCoords(latitude: number, longitude: number): string | null {
  for (const [city, bounds] of Object.entries(CITY_BOUNDS)) {
    if (
      latitude >= bounds.minLat &&
      latitude <= bounds.maxLat &&
      longitude >= bounds.minLng &&
      longitude <= bounds.maxLng
    ) {
      return city;
    }
  }
  return null;
}

/**
 * Build ArcGIS REST query URL for spatial queries
 */
export function buildArcGisQueryUrl(
  layerId: number,
  params: Record<string, string>
): string {
  const base = `${API_URLS.TAIPEI_ARCGIS}/${layerId}/query`;
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('f', 'json');
  return url.toString();
}

/**
 * Build ArcGIS spatial query parameters for a point
 */
export function buildSpatialQueryParams(
  latitude: number,
  longitude: number,
  extraWhere?: string
): Record<string, string> {
  return {
    where: extraWhere ?? '1=1',
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
  };
}

/**
 * Build ArcGIS buffer query parameters for radius search
 */
export function buildBufferQueryParams(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  extraWhere?: string
): Record<string, string> {
  // Approximate degree offset for buffer (1 degree ~ 111km)
  const degreeOffset = radiusMeters / 111_000;
  const envelope = `${longitude - degreeOffset},${latitude - degreeOffset},${longitude + degreeOffset},${latitude + degreeOffset}`;
  return {
    where: extraWhere ?? '1=1',
    geometry: envelope,
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    distance: String(radiusMeters),
    units: 'esriSRUnit_Meter',
  };
}

/**
 * Fetch with timeout wrapper
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch ArcGIS REST API
 */
export async function fetchArcGis(
  layerId: number,
  params: Record<string, string>
): Promise<ArcGisResponse> {
  const url = buildArcGisQueryUrl(layerId, params);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ArcGisResponse;

  if (data.error) {
    throw new Error(`ArcGIS query error: ${data.error.message}`);
  }

  return data;
}

/**
 * Fetch Taichung Open Data API
 */
export async function fetchTaichungApi(
  endpoint: string,
  params?: Record<string, string>
): Promise<TaichungApiResponse> {
  const url = new URL(`${API_URLS.TAICHUNG_API}/${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetchWithTimeout(url.toString());

  if (!response.ok) {
    throw new Error(`Taichung API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TaichungApiResponse;
  return data;
}

/**
 * Fetch NLSC WFS (GeoJSON)
 */
export async function fetchNlscWfs(
  typeName: string,
  params?: Record<string, string>
): Promise<NlscFeatureCollection> {
  const url = new URL(API_URLS.NLSC_WFS);
  url.searchParams.set('SERVICE', 'WFS');
  url.searchParams.set('VERSION', '1.1.0');
  url.searchParams.set('REQUEST', 'GetFeature');
  url.searchParams.set('TYPENAME', typeName);
  url.searchParams.set('OUTPUTFORMAT', 'application/json');
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetchWithTimeout(url.toString());

  if (!response.ok) {
    throw new Error(`NLSC WFS error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as NlscFeatureCollection;
  return data;
}
