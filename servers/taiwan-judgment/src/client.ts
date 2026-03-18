import type { JudgmentSearchResult, JudgmentDetail, JudgmentApiResponse } from './types.js';

const API_BASE = 'https://data.judicial.gov.tw/jdg/api/';

export const CASE_TYPE_MAP: Record<string, string> = {
  civil: '民事',
  criminal: '刑事',
  administrative: '行政',
};

export function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function searchJudgments(
  keyword: string,
  limit: number = 20
): Promise<{ judgments: JudgmentSearchResult[]; total: number }> {
  const url = buildUrl('JSearch', { q: keyword, limit: String(limit) });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`裁判書搜尋 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as JudgmentApiResponse;
  const records = data.records ?? data.data ?? [];
  return {
    judgments: Array.isArray(records) ? records.slice(0, limit) : [],
    total: data.total ?? (Array.isArray(records) ? records.length : 0),
  };
}

export async function getJudgmentById(
  id: string
): Promise<JudgmentDetail | null> {
  const url = buildUrl('JDetail', { id });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得裁判書 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as JudgmentDetail | null;
  return data;
}

export async function searchByCourt(
  court: string,
  limit: number = 20
): Promise<{ judgments: JudgmentSearchResult[]; total: number }> {
  const url = buildUrl('JSearch', { court, limit: String(limit) });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`依法院搜尋 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as JudgmentApiResponse;
  const records = data.records ?? data.data ?? [];
  return {
    judgments: Array.isArray(records) ? records.slice(0, limit) : [],
    total: data.total ?? (Array.isArray(records) ? records.length : 0),
  };
}

export async function searchByCaseType(
  caseType: string,
  keyword?: string,
  limit: number = 20
): Promise<{ judgments: JudgmentSearchResult[]; total: number }> {
  const params: Record<string, string> = {
    type: caseType,
    limit: String(limit),
  };
  if (keyword) {
    params.q = keyword;
  }

  const url = buildUrl('JSearch', params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`依案件類型搜尋 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as JudgmentApiResponse;
  const records = data.records ?? data.data ?? [];
  return {
    judgments: Array.isArray(records) ? records.slice(0, limit) : [],
    total: data.total ?? (Array.isArray(records) ? records.length : 0),
  };
}

export async function getRecentJudgments(
  court?: string,
  limit: number = 20
): Promise<{ judgments: JudgmentSearchResult[]; total: number }> {
  const params: Record<string, string> = {
    limit: String(limit),
    sort: 'date_desc',
  };
  if (court) {
    params.court = court;
  }

  const url = buildUrl('JRecent', params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得最新裁判書 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as JudgmentApiResponse;
  const records = data.records ?? data.data ?? [];
  return {
    judgments: Array.isArray(records) ? records.slice(0, limit) : [],
    total: data.total ?? (Array.isArray(records) ? records.length : 0),
  };
}
