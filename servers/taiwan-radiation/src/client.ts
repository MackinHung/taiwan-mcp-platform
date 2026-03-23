import type { RadiationRecord, OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Dataset — 環境輻射即時監測資料
export const RADIATION_RESOURCE_ID = 'a2940c4a-c75c-4e69-8413-f9e00e5e87b2';

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

const FIELD_MAP: Record<string, keyof RadiationRecord> = {
  '監測站名稱': 'stationName',
  '監測值': 'value',
  '測量時間': 'measureTime',
  '所在縣市': 'county',
  '所在地區': 'district',
  '監測站地址': 'address',
  '狀態': 'status',
};

const NUMBER_FIELDS: Set<keyof RadiationRecord> = new Set(['value']);

function normalizeRecord(raw: Record<string, string>): RadiationRecord {
  const record: Partial<RadiationRecord> = {};

  for (const [chineseKey, englishKey] of Object.entries(FIELD_MAP)) {
    const value = raw[chineseKey] ?? '';
    if (NUMBER_FIELDS.has(englishKey)) {
      (record as Record<string, unknown>)[englishKey] = parseFloat(value) || 0;
    } else {
      (record as Record<string, unknown>)[englishKey] = value;
    }
  }

  return {
    stationName: record.stationName ?? '',
    value: record.value ?? 0,
    measureTime: record.measureTime ?? '',
    county: record.county ?? '',
    district: record.district ?? '',
    address: record.address ?? '',
    status: record.status ?? '正常',
  };
}

export async function fetchRadiationData(
  params?: { county?: string; limit?: number; offset?: number }
): Promise<{ records: RadiationRecord[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.county) {
    filters['所在縣市'] = params.county;
  }

  const url = buildUrl(RADIATION_RESOURCE_ID, {
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
