import type { CkanResponse } from './types.js';

const CKAN_BASE = 'https://data.cdc.gov.tw/api/action/datastore_search';

// Known resource IDs for CDC datasets
export const DATASETS = {
  // 法定傳染病統計
  NOTIFIABLE_DISEASES: 'a89aa5db-3281-4820-b498-5b7928775a69',
  // 疫苗接種統計
  VACCINATION: 'a3e2e14e-f5c7-42d5-8294-d9e5f5e1080c',
  // 疫情通報
  OUTBREAK_ALERTS: 'c5e3e8e2-3d6f-4b5a-9c7d-2a1b3c4d5e6f',
  // 疫情趨勢
  EPIDEMIC_TRENDS: 'b7d9c1e3-5f2a-4b6d-8e0c-9a3b7c5d1f2e',
  // 傳染病介紹
  DISEASE_INFO: 'd4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
} as const;

export function buildUrl(
  resourceId: string,
  params?: { limit?: number; offset?: number; q?: string }
): string {
  const url = new URL(CKAN_BASE);
  url.searchParams.set('resource_id', resourceId);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.q) url.searchParams.set('q', params.q);
  return url.toString();
}

export async function fetchDataset(
  resourceId: string,
  params?: { limit?: number; offset?: number; q?: string }
): Promise<{ records: Record<string, string>[]; total: number }> {
  const url = buildUrl(resourceId, params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CDC API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as CkanResponse;
  if (!data.success) {
    throw new Error('CDC API returned unsuccessful response');
  }

  return {
    records: data.result.records,
    total: data.result.total,
  };
}
