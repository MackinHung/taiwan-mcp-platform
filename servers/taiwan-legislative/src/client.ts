import type { LyApiResponse } from './types.js';

const LY_API_BASE = 'https://v2.ly.govapi.tw';

export const ENDPOINTS = {
  BILLS: '/bills',
  LEGISLATORS: '/legislators',
  MEETINGS: '/meetings',
  INTERPELLATIONS: '/interpellations',
} as const;

export function buildUrl(
  endpoint: string,
  params?: {
    limit?: number;
    offset?: number;
    query?: string;
    id?: string;
    filters?: Record<string, string | number>;
  }
): string {
  const path = params?.id ? `${endpoint}/${params.id}` : endpoint;
  const url = new URL(`${LY_API_BASE}${path}`);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.query) url.searchParams.set('q', params.query);
  if (params?.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function fetchLyApi<T = Record<string, string>>(
  endpoint: string,
  params?: {
    limit?: number;
    offset?: number;
    query?: string;
    id?: string;
    filters?: Record<string, string | number>;
    apiKey?: string;
  }
): Promise<{ records: T[]; total: number }> {
  const url = buildUrl(endpoint, params);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (params?.apiKey) {
    headers['Authorization'] = `Bearer ${params.apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`LY API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LyApiResponse<T> | T[] | T;

  // Handle array response
  if (Array.isArray(data)) {
    return { records: data, total: data.length };
  }

  // Handle single record response (for detail endpoints)
  if (data && typeof data === 'object' && !('records' in data)) {
    return { records: [data as T], total: 1 };
  }

  const apiData = data as LyApiResponse<T>;
  return {
    records: apiData.records ?? [],
    total: apiData.total ?? 0,
  };
}
