import type { WraApiResponse, SensorThingsResponse } from './types.js';

const FETCH_TIMEOUT = 10_000;

const WRA_BASE = 'https://opendata.wra.gov.tw/api/v2';

const SENSOR_THINGS_PRIMARY = 'https://sta.ci.taiwan.gov.tw/FROST-Server/v1.0';
const SENSOR_THINGS_BACKUP = 'https://sta.colife.org.tw/FROST-Server/v1.0';

export const WRA_DATASETS = {
  FLOOD_POTENTIAL: '53564',
  RESERVOIR: '45501',
  RIVER_LEVEL: '25768',
  RAINFALL: '9177',
} as const;

export function buildWraUrl(datasetId: string, params?: Record<string, string>): string {
  const url = new URL(`${WRA_BASE}/${datasetId}`);
  url.searchParams.set('format', 'JSON');
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function buildSensorThingsUrl(
  path: string,
  params?: Record<string, string>,
  baseUrl: string = SENSOR_THINGS_PRIMARY
): string {
  const url = new URL(`${baseUrl}/${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function fetchWithTimeout(url: string, timeout: number = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWraDataset<T>(
  datasetId: string,
  params?: Record<string, string>
): Promise<T[]> {
  const url = buildWraUrl(datasetId, params);
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`WRA API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as WraApiResponse<T>;
  if (!data.responseData) {
    return [];
  }
  return data.responseData;
}

export async function fetchSensorThings<T>(
  path: string,
  params?: Record<string, string>
): Promise<T[]> {
  // Try primary endpoint first, then fallback
  try {
    const url = buildSensorThingsUrl(path, params, SENSOR_THINGS_PRIMARY);
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`SensorThings API error: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as SensorThingsResponse<T>;
    return data.value ?? [];
  } catch (primaryError) {
    // Fallback to backup endpoint
    try {
      const url = buildSensorThingsUrl(path, params, SENSOR_THINGS_BACKUP);
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`SensorThings backup API error: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as SensorThingsResponse<T>;
      return data.value ?? [];
    } catch {
      // Re-throw the primary error if backup also fails
      throw primaryError;
    }
  }
}
