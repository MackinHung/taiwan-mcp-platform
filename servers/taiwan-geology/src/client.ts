import type { LandslideAlert, SensitiveAreaGeoJSON } from './types.js';

const FETCH_TIMEOUT_MS = 10_000;

export const API_URLS = {
  LANDSLIDE_ALERT: 'https://ls.ardswc.gov.tw/api/LandslideAlertOpenData',
  ACTIVE_FAULTS_CSV: 'https://www.gsmma.gov.tw/uploads/1718158875828SHvikG0X.csv',
  SENSITIVE_AREAS_GEOJSON: 'https://data.gov.tw/api/v2/rest/dataset/100220',
  WMS_BASE: 'https://geomap.gsmma.gov.tw/mapguide/mapagent/mapagent.fcgi',
} as const;

export function buildWmsUrl(params: Record<string, string>): string {
  const url = new URL(API_URLS.WMS_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

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

export async function fetchLandslideAlerts(): Promise<LandslideAlert[]> {
  const response = await fetchWithTimeout(API_URLS.LANDSLIDE_ALERT);
  if (!response.ok) {
    throw new Error(`ARDSWC API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data as LandslideAlert[];
}

export async function fetchActiveFaultsCsv(): Promise<string> {
  const response = await fetchWithTimeout(API_URLS.ACTIVE_FAULTS_CSV);
  if (!response.ok) {
    throw new Error(`Active faults CSV error: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function fetchSensitiveAreas(): Promise<SensitiveAreaGeoJSON> {
  const response = await fetchWithTimeout(API_URLS.SENSITIVE_AREAS_GEOJSON, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Sensitive areas API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data as SensitiveAreaGeoJSON;
}

export async function fetchWmsFeatureInfo(
  latitude: number,
  longitude: number,
  layers: string
): Promise<string> {
  const bbox = `${longitude - 0.001},${latitude - 0.001},${longitude + 0.001},${latitude + 0.001}`;
  const url = buildWmsUrl({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layers,
    QUERY_LAYERS: layers,
    BBOX: bbox,
    WIDTH: '101',
    HEIGHT: '101',
    SRS: 'EPSG:4326',
    X: '50',
    Y: '50',
    INFO_FORMAT: 'text/plain',
  });
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`WMS API error: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Calculate distance in km between two WGS84 coordinates using Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Parse a CSV string into an array of objects using the first row as headers.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"/, '').replace(/"$/, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"/, '').replace(/"$/, ''));
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? '';
    }
    return row;
  });
}

/**
 * Get centroid of a GeoJSON geometry (simplified: handles Point, Polygon, MultiPolygon).
 */
export function getGeometryCentroid(
  geometry: { type: string; coordinates: unknown }
): { lat: number; lon: number } | null {
  if (geometry.type === 'Point') {
    const coords = geometry.coordinates as [number, number];
    return { lat: coords[1], lon: coords[0] };
  }

  if (geometry.type === 'Polygon') {
    const ring = (geometry.coordinates as number[][][])[0];
    return computeRingCentroid(ring);
  }

  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as number[][][][];
    if (polygons.length === 0) return null;
    const ring = polygons[0][0];
    return computeRingCentroid(ring);
  }

  return null;
}

function computeRingCentroid(ring: number[][]): { lat: number; lon: number } {
  if (!ring || ring.length === 0) return { lat: 0, lon: 0 };
  let sumLon = 0;
  let sumLat = 0;
  for (const coord of ring) {
    sumLon += coord[0];
    sumLat += coord[1];
  }
  return { lat: sumLat / ring.length, lon: sumLon / ring.length };
}
