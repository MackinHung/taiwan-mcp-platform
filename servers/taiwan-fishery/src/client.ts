import type { FisheryRecord, OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';
export const FISHERY_RESOURCE_ID = 'a8b5c7d2-3e1f-4f6a-9b0c-d2e3f4a5b6c7';

export function buildUrl(
  resourceId: string,
  params?: { limit?: number; offset?: number; filters?: Record<string, string> }
): string {
  const url = new URL(`${OPENDATA_BASE}/${resourceId}`);
  url.searchParams.set('format', 'json');
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.filters) url.searchParams.set('filters', JSON.stringify(params.filters));
  return url.toString();
}

const FIELD_MAP: Record<string, keyof FisheryRecord> = {
  '年度': 'year',
  '漁業類別': 'category',
  '魚種名稱': 'speciesName',
  '產量': 'production',
  '產值': 'value',
  '漁港名稱': 'portName',
  '漁港地址': 'portAddress',
  '漁港縣市': 'portCounty',
  '養殖面積': 'aquacultureArea',
};

const NUMBER_FIELDS: Set<keyof FisheryRecord> = new Set([
  'production', 'value', 'aquacultureArea',
]);

function normalizeRecord(raw: Record<string, string>): FisheryRecord {
  const record: Partial<FisheryRecord> = {};
  for (const [chineseKey, englishKey] of Object.entries(FIELD_MAP)) {
    const value = raw[chineseKey] ?? '';
    if (NUMBER_FIELDS.has(englishKey)) {
      (record as Record<string, unknown>)[englishKey] = parseFloat(value) || 0;
    } else {
      (record as Record<string, unknown>)[englishKey] = value;
    }
  }
  return {
    year: record.year ?? '',
    category: record.category ?? '',
    speciesName: record.speciesName ?? '',
    production: record.production ?? 0,
    value: record.value ?? 0,
    portName: record.portName ?? '',
    portAddress: record.portAddress ?? '',
    portCounty: record.portCounty ?? '',
    aquacultureArea: record.aquacultureArea ?? 0,
  };
}

export async function fetchFisheryData(
  params?: { category?: string; limit?: number; offset?: number }
): Promise<{ records: FisheryRecord[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.category) filters['漁業類別'] = params.category;
  const url = buildUrl(FISHERY_RESOURCE_ID, {
    limit: params?.limit ?? 100,
    offset: params?.offset,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open Data API error: ${response.status} ${response.statusText}`);
  const data = (await response.json()) as OpenDataResponse;
  if (!data.success) throw new Error('Open Data API returned unsuccessful response');
  return { records: data.result.records.map(normalizeRecord), total: data.result.total };
}
