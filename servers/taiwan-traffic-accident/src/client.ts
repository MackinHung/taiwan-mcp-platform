import type { AccidentRecord, OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Dataset — A2 交通事故資料 (biweekly update)
export const ACCIDENT_RESOURCE_ID = '73a7a8f6-0e39-4d18-a1c3-36ff3ddb6e42';

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

// Field name mapping: Chinese field names from data.gov.tw → AccidentRecord properties
const FIELD_MAP: Record<string, keyof AccidentRecord> = {
  '發生日期': 'occurDate',
  '發生時間': 'occurTime',
  '發生縣市': 'county',
  '發生市區鄉鎮': 'district',
  '發生地點': 'address',
  '事故類型': 'accidentType',
  '死亡人數': 'deathCount',
  '受傷人數': 'injuryCount',
  '當事者區分_車種': 'vehicleTypes',
  '天候': 'weatherCondition',
  '路面狀況': 'roadCondition',
  '光線': 'lightCondition',
  '肇事原因': 'cause',
};

const NUMBER_FIELDS: Set<keyof AccidentRecord> = new Set(['deathCount', 'injuryCount']);

function normalizeRecord(raw: Record<string, string>): AccidentRecord {
  const record: Partial<AccidentRecord> = {};

  for (const [chineseKey, englishKey] of Object.entries(FIELD_MAP)) {
    const value = raw[chineseKey] ?? '';
    if (NUMBER_FIELDS.has(englishKey)) {
      (record as Record<string, unknown>)[englishKey] = parseInt(value, 10) || 0;
    } else {
      (record as Record<string, unknown>)[englishKey] = value;
    }
  }

  return {
    occurDate: record.occurDate ?? '',
    occurTime: record.occurTime ?? '',
    county: record.county ?? '',
    district: record.district ?? '',
    address: record.address ?? '',
    accidentType: record.accidentType ?? '',
    deathCount: record.deathCount ?? 0,
    injuryCount: record.injuryCount ?? 0,
    vehicleTypes: record.vehicleTypes ?? '',
    weatherCondition: record.weatherCondition ?? '',
    roadCondition: record.roadCondition ?? '',
    lightCondition: record.lightCondition ?? '',
    cause: record.cause ?? '',
  };
}

export async function fetchAccidents(
  params?: { county?: string; limit?: number; offset?: number }
): Promise<{ records: AccidentRecord[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.county) {
    filters['發生縣市'] = params.county;
  }

  const url = buildUrl(ACCIDENT_RESOURCE_ID, {
    limit: params?.limit ?? 100,
    offset: params?.offset,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Data API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenDataResponse;
  if (!data.success) {
    throw new Error('Open Data API returned unsuccessful response');
  }

  const records = data.result.records.map(normalizeRecord);
  return {
    records,
    total: data.result.total,
  };
}
