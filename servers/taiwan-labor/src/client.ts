import type { OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

export const RESOURCE_IDS = {
  WAGE_STATISTICS: '6415',
} as const;

export function buildUrl(
  resourceId: string,
  params?: Record<string, string>
): string {
  const url = new URL(`${OPENDATA_BASE}/${resourceId}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function fetchOpenData<T>(
  resourceId: string,
  params?: Record<string, string>
): Promise<T[]> {
  const url = buildUrl(resourceId, params);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `data.gov.tw API error: ${response.status} ${response.statusText}`
    );
  }
  const data = (await response.json()) as OpenDataResponse<T>;
  if (!data.success) {
    throw new Error('data.gov.tw API returned unsuccessful response');
  }
  return data.result.records;
}
