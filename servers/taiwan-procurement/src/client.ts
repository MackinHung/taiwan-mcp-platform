import type { PmsApiResponse, DataGovResponse, TenderRecord } from './types.js';

const PMS_API_BASE = 'https://pms.sme.gov.tw/PMSApi/v2/ODT/OPN';
const DATAGOV_BASE = 'https://data.gov.tw/api/v2/rest/datastore';
export const DATAGOV_RESOURCE_ID = '16370';

export const API_SOURCES = {
  PMS: 'pms',
  DATAGOV: 'datagov',
} as const;

export function buildPmsUrl(
  params?: {
    limit?: number;
    offset?: number;
    keyword?: string;
    agency?: string;
    status?: string;
  }
): string {
  const url = new URL(PMS_API_BASE);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.keyword) url.searchParams.set('keyword', params.keyword);
  if (params?.agency) url.searchParams.set('agency', params.agency);
  if (params?.status) url.searchParams.set('status', params.status);
  return url.toString();
}

export function buildDataGovUrl(
  params?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, string>;
  }
): string {
  const url = new URL(`${DATAGOV_BASE}/${DATAGOV_RESOURCE_ID}`);
  url.searchParams.set('format', 'json');
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.filters) {
    const filterStr = JSON.stringify(params.filters);
    url.searchParams.set('filters', filterStr);
  }
  return url.toString();
}

export async function fetchPmsApi(
  params?: {
    limit?: number;
    offset?: number;
    keyword?: string;
    agency?: string;
    status?: string;
  }
): Promise<{ records: TenderRecord[]; total: number }> {
  const url = buildPmsUrl(params);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`PMS API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as PmsApiResponse | TenderRecord[];

  // Handle array response
  if (Array.isArray(data)) {
    return { records: data, total: data.length };
  }

  return {
    records: data.records ?? [],
    total: data.total ?? 0,
  };
}

export async function fetchDataGov(
  params?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, string>;
  }
): Promise<{ records: Record<string, string>[]; total: number }> {
  const url = buildDataGovUrl(params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Data.gov.tw API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as DataGovResponse;
  if (!data.success) {
    throw new Error('Data.gov.tw API returned unsuccessful response');
  }

  return {
    records: data.result.records,
    total: data.result.total,
  };
}
