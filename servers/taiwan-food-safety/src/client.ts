const FDA_BASE = 'https://data.fda.gov.tw/opendata/exportDataList.do';

export const DATASETS = {
  DRUG_APPROVAL: '36',
  FOOD_BUSINESS: '97',
  FOOD_VIOLATION: '155',
  FOOD_ADDITIVE: '70',
  HYGIENE_INSPECTION: '74',
} as const;

export function buildUrl(infoId: string, limit: number = 50): string {
  const url = new URL(FDA_BASE);
  url.searchParams.set('method', 'openDataApi');
  url.searchParams.set('InfoId', infoId);
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export async function fetchDataset<T>(
  infoId: string,
  limit: number = 50
): Promise<T[]> {
  const url = buildUrl(infoId, limit);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // FDA API returns array directly
  if (!Array.isArray(data)) {
    throw new Error('FDA API returned unexpected format');
  }

  return data as T[];
}
