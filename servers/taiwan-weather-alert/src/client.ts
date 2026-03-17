import type { CwaApiResponse } from './types.js';

const CWA_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

export const DATASETS = {
  EARTHQUAKE_FELT: 'E-A0015-001',
  EARTHQUAKE_LOCAL: 'E-A0016-001',
  WEATHER_WARNING: 'W-C0033-002',
  TYPHOON: 'W-C0034-001',
  HEAVY_RAIN: 'F-A0078-001',
} as const;

export function buildUrl(datasetId: string, params?: Record<string, string>): string {
  const url = new URL(`${CWA_BASE}/${datasetId}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function fetchDataset<T>(
  apiKey: string,
  datasetId: string,
  params?: Record<string, string>
): Promise<T> {
  const url = buildUrl(datasetId, params);
  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });
  if (!response.ok) {
    throw new Error(`CWA API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as CwaApiResponse<T>;
  if (data.success !== 'true') {
    throw new Error('CWA API returned unsuccessful response');
  }
  return data.records;
}
