import type { FoodNutritionRecord } from './types.js';

const FDA_BASE = 'https://data.fda.gov.tw/opendata/exportDataList.do';

export const DATASETS = {
  FOOD_NUTRITION: '20',
} as const;

export function buildUrl(infoId: string, limit: number = 50): string {
  const url = new URL(FDA_BASE);
  url.searchParams.set('method', 'openDataApi');
  url.searchParams.set('InfoId', infoId);
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export async function fetchFoodNutritionData(
  limit: number = 50
): Promise<FoodNutritionRecord[]> {
  const url = buildUrl(DATASETS.FOOD_NUTRITION, limit);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('FDA API returned unexpected format');
  }

  return data as FoodNutritionRecord[];
}
