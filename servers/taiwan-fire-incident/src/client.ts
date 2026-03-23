import type { FireRecord, OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

export const FIRE_RESOURCE_ID = 'b319af60-5709-4977-a3db-d8e246294e49';

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

const FIELD_MAP: Record<string, keyof FireRecord> = {
  '\u767C\u751F\u65E5\u671F': 'occurDate',
  '\u767C\u751F\u6642\u9593': 'occurTime',
  '\u767C\u751F\u7E23\u5E02': 'county',
  '\u767C\u751F\u5730\u5340': 'district',
  '\u706B\u707D\u985E\u578B': 'fireType',
  '\u8D77\u706B\u539F\u56E0': 'cause',
  '\u6B7B\u4EA1\u4EBA\u6578': 'deathCount',
  '\u53D7\u50B7\u4EBA\u6578': 'injuryCount',
  '\u71D2\u640D\u9762\u7A4D': 'burnArea',
  '\u8CA1\u7269\u640D\u5931\u4F30\u503C': 'propertyLoss',
};

const NUMBER_FIELDS: Set<keyof FireRecord> = new Set([
  'deathCount', 'injuryCount', 'burnArea', 'propertyLoss',
]);

export function normalizeRecord(raw: Record<string, string>): FireRecord {
  const record: Partial<FireRecord> = {};

  for (const [chineseKey, englishKey] of Object.entries(FIELD_MAP)) {
    const value = raw[chineseKey] ?? '';
    if (NUMBER_FIELDS.has(englishKey)) {
      (record as Record<string, unknown>)[englishKey] = parseFloat(value) || 0;
    } else {
      (record as Record<string, unknown>)[englishKey] = value;
    }
  }

  return {
    occurDate: record.occurDate ?? '',
    occurTime: record.occurTime ?? '',
    county: record.county ?? '',
    district: record.district ?? '',
    fireType: record.fireType ?? '',
    cause: record.cause ?? '',
    deathCount: record.deathCount ?? 0,
    injuryCount: record.injuryCount ?? 0,
    burnArea: record.burnArea ?? 0,
    propertyLoss: record.propertyLoss ?? 0,
  };
}

export async function fetchFireData(
  params?: { county?: string; limit?: number; offset?: number }
): Promise<{ records: FireRecord[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.county) {
    filters['\u767C\u751F\u7E23\u5E02'] = params.county;
  }

  const url = buildUrl(FIRE_RESOURCE_ID, {
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
