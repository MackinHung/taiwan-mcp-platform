import type { LawSearchResult, LawDetail, LawArticle, LawHistory, LawCategory } from './types.js';

const API_BASE = 'https://law.moj.gov.tw/api/';

export function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function searchLaws(
  keyword: string,
  limit: number = 20
): Promise<{ laws: LawSearchResult[]; total: number }> {
  const url = buildUrl('LawSearchList', { keyword, limit: String(limit) });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`法規搜尋 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LawSearchResult[];
  return {
    laws: Array.isArray(data) ? data.slice(0, limit) : [],
    total: Array.isArray(data) ? data.length : 0,
  };
}

export async function getLawById(pcode: string): Promise<LawDetail> {
  const url = buildUrl('Law', { pcode });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得法規 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LawDetail;
  return data;
}

export async function getLawArticles(pcode: string): Promise<LawArticle[]> {
  const url = buildUrl('LawArticle', { pcode });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得法規條文 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LawArticle[];
  return Array.isArray(data) ? data : [];
}

export async function getLawHistory(pcode: string): Promise<LawHistory> {
  const url = buildUrl('LawHistory', { pcode });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得法規沿革 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LawHistory;
  return data;
}

export async function getCategoryList(): Promise<LawCategory[]> {
  const url = buildUrl('LawCategoryList');
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得法規分類 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LawCategory[];
  return Array.isArray(data) ? data : [];
}
