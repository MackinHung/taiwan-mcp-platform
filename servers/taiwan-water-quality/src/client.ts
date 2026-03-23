import type { WaterQualityRecord, OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';
export const WATER_QUALITY_RESOURCE_ID = '36a68e7f-58d5-4f12-8a4e-311b4b0f481c';

export function buildUrl(
  resourceId: string,
  params?: { limit?: number; offset?: number; filters?: Record<string, string> }
): string {
  const url = new URL(`${OPENDATA_BASE}/${resourceId}`);
  url.searchParams.set('format', 'json');
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  if (params?.filters) {
    url.searchParams.set('filters', JSON.stringify(params.filters));
  }
  return url.toString();
}

const FIELD_MAP: Record<string, keyof WaterQualityRecord> = {
  '河川名稱': 'riverName',
  '測站名稱': 'stationName',
  '採樣日期': 'sampleDate',
  '水溫': 'waterTemp',
  'pH值': 'ph',
  '溶氧量': 'dissolvedOxygen',
  '生化需氧量': 'bod',
  '氨氮': 'ammonia',
  '懸浮固體': 'suspendedSolids',
  '河川污染指數RPI': 'rpiIndex',
  '污染程度': 'pollutionLevel',
  '縣市': 'county',
};

const NUMBER_FIELDS: Set<keyof WaterQualityRecord> = new Set([
  'waterTemp', 'ph', 'dissolvedOxygen', 'bod', 'ammonia', 'suspendedSolids', 'rpiIndex',
]);

export function normalizeRecord(raw: Record<string, string>): WaterQualityRecord {
  const record: Partial<WaterQualityRecord> = {};
  for (const [chineseKey, englishKey] of Object.entries(FIELD_MAP)) {
    const value = raw[chineseKey] ?? '';
    if (NUMBER_FIELDS.has(englishKey)) {
      (record as Record<string, unknown>)[englishKey] = parseFloat(value) || 0;
    } else {
      (record as Record<string, unknown>)[englishKey] = value;
    }
  }
  return {
    riverName: record.riverName ?? '',
    stationName: record.stationName ?? '',
    sampleDate: record.sampleDate ?? '',
    waterTemp: record.waterTemp ?? 0,
    ph: record.ph ?? 0,
    dissolvedOxygen: record.dissolvedOxygen ?? 0,
    bod: record.bod ?? 0,
    ammonia: record.ammonia ?? 0,
    suspendedSolids: record.suspendedSolids ?? 0,
    rpiIndex: record.rpiIndex ?? 0,
    pollutionLevel: record.pollutionLevel ?? '',
    county: record.county ?? '',
  };
}

export async function fetchWaterQualityData(
  params?: { county?: string; limit?: number; offset?: number }
): Promise<{ records: WaterQualityRecord[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.county) filters['縣市'] = params.county;
  const url = buildUrl(WATER_QUALITY_RESOURCE_ID, {
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
