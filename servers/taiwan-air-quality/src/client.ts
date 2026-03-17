import type { AqiStation, MoenvApiResponse } from './types.js';

const MOENV_BASE = 'https://data.moenv.gov.tw/api/v2';

export const DATASETS = {
  AQI_CURRENT: 'aqx_p_432',
} as const;

export function buildUrl(
  datasetId: string,
  apiKey: string,
  params?: Record<string, string>
): string {
  const url = new URL(`${MOENV_BASE}/${datasetId}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('format', 'json');
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function fetchAqiData(
  apiKey: string,
  params?: Record<string, string>
): Promise<AqiStation[]> {
  const url = buildUrl(DATASETS.AQI_CURRENT, apiKey, {
    limit: '1000',
    ...params,
  });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MOENV API error: ${response.status}`);
  }
  const data = (await response.json()) as MoenvApiResponse;
  return data.records ?? [];
}
