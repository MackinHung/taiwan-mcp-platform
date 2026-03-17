import type { OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Known dataset resource IDs for budget data
export const DATASETS = {
  // 中央政府歲出預算 (Central government expenditure budget)
  EXPENDITURE: 'A41000000G-000001',
  // 中央政府歲入預算 (Central government revenue budget)
  REVENUE: 'A41000000G-000002',
  // 各機關預算員額彙總表 (Agency budget summary)
  AGENCY_SUMMARY: 'A41000000G-000003',
  // 中央政府決算 (Central government final accounts)
  FINAL_ACCOUNTS: 'A41000000G-000004',
  // 特別預算 (Special budgets)
  SPECIAL_BUDGET: 'A41000000G-000005',
} as const;

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

export async function fetchDataset(
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
