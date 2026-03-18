import type { OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Dataset #14718 — 行政院人事行政總處 holidays
export const HOLIDAY_RESOURCE_ID = '382000000A-000077-001';

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

export async function fetchHolidays(
  year: number
): Promise<{ records: Record<string, string>[]; total: number }> {
  // The dataset uses date format like "2026/1/1"
  // We fetch all records for the year with a large limit
  const url = buildUrl(HOLIDAY_RESOURCE_ID, {
    limit: 400,
    filters: { '西元日期': `${year}` },
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Data API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenDataResponse;
  if (!data.success) {
    throw new Error('Open Data API returned unsuccessful response');
  }

  // Filter records where the date starts with the requested year
  const filtered = data.result.records.filter((r) => {
    const dateStr = r['西元日期'] ?? '';
    return dateStr.startsWith(`${year}/`) || dateStr.startsWith(`${year}-`);
  });

  return {
    records: filtered,
    total: filtered.length,
  };
}
