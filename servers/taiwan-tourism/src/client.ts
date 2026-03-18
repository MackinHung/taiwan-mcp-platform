import type { OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Dataset #315 — 觀光資訊資料庫-景點
export const ATTRACTION_RESOURCE_ID = '315';

// Dataset #355 — 觀光資訊資料庫-活動
export const EVENT_RESOURCE_ID = '355';

// Dataset #316 — 觀光資訊資料庫-旅館
export const ACCOMMODATION_RESOURCE_ID = '316';

export function buildUrl(
  resourceId: string,
  params?: { limit?: number; offset?: number; filters?: Record<string, string> }
): string {
  const url = new URL(`${OPENDATA_BASE}/${resourceId}`);
  url.searchParams.set('format', 'json');
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.filters) {
    const filterStr = JSON.stringify(params.filters);
    url.searchParams.set('filters', filterStr);
  }
  return url.toString();
}

async function fetchOpenData(
  resourceId: string,
  params?: { limit?: number; offset?: number; filters?: Record<string, string> }
): Promise<{ records: Record<string, string>[]; total: number }> {
  const url = buildUrl(resourceId, params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Data API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenDataResponse;
  if (!data.success) {
    throw new Error('Open Data API returned unsuccessful response');
  }

  return {
    records: data.result.records,
    total: data.result.total,
  };
}

export async function fetchAttractions(
  params?: { keyword?: string; city?: string; limit?: number }
): Promise<{ records: Record<string, string>[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.keyword) filters['Name'] = params.keyword;
  if (params?.city) filters['Region'] = params.city;

  return fetchOpenData(ATTRACTION_RESOURCE_ID, {
    limit: params?.limit ?? 20,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });
}

export async function fetchEvents(
  params?: { keyword?: string; city?: string; limit?: number }
): Promise<{ records: Record<string, string>[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.keyword) filters['Name'] = params.keyword;
  if (params?.city) filters['Region'] = params.city;

  return fetchOpenData(EVENT_RESOURCE_ID, {
    limit: params?.limit ?? 20,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });
}

export async function fetchAccommodation(
  params?: { keyword?: string; city?: string; limit?: number }
): Promise<{ records: Record<string, string>[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.keyword) filters['Name'] = params.keyword;
  if (params?.city) filters['Region'] = params.city;

  return fetchOpenData(ACCOMMODATION_RESOURCE_ID, {
    limit: params?.limit ?? 20,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });
}
