import type { ReservoirRecord } from './types.js';

const WRA_BASE = 'https://data.wra.gov.tw/Service/OpenData.aspx';

// Fallback: data.gov.tw dataset #45501
const DATA_GOV_BASE = 'https://data.gov.tw/api/v2/rest/datastore';
const RESERVOIR_DATASET_ID = 'A21000000I-002095-059';

export function buildWraUrl(params?: { format?: string }): string {
  const url = new URL(WRA_BASE);
  url.searchParams.set('format', params?.format ?? 'json');
  url.searchParams.set('UnitId', 'A21000000I');
  return url.toString();
}

export function buildDataGovUrl(params?: { limit?: number; offset?: number }): string {
  const url = new URL(`${DATA_GOV_BASE}/${RESERVOIR_DATASET_ID}`);
  url.searchParams.set('format', 'json');
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.offset) url.searchParams.set('offset', String(params.offset));
  return url.toString();
}

function normalizeRecord(raw: Record<string, unknown>): ReservoirRecord {
  const r: ReservoirRecord = {};
  r.ReservoirName = String(
    raw['ReservoirName'] ?? raw['水庫名稱'] ?? raw['reservoir_name'] ?? ''
  );
  r.CatchmentAreaRainfall = String(
    raw['CatchmentAreaRainfall'] ?? raw['集水區雨量'] ?? raw['catchment_area_rainfall'] ?? ''
  );
  r.EffectiveCapacity = String(
    raw['EffectiveCapacity'] ?? raw['有效容量'] ?? raw['effective_capacity'] ?? ''
  );
  r.CurrentCapacity = String(
    raw['CurrentCapacity'] ?? raw['蓄水量'] ?? raw['current_capacity'] ?? ''
  );
  r.CurrentCapacityPercent = String(
    raw['CurrentCapacityPercent'] ?? raw['蓄水百分比'] ?? raw['current_capacity_percent'] ?? ''
  );
  r.WaterInflow = String(
    raw['WaterInflow'] ?? raw['進水量'] ?? raw['water_inflow'] ?? ''
  );
  r.WaterOutflow = String(
    raw['WaterOutflow'] ?? raw['出水量'] ?? raw['water_outflow'] ?? ''
  );
  r.WaterSupply = String(
    raw['WaterSupply'] ?? raw['供水量'] ?? raw['water_supply'] ?? ''
  );
  r.UpdateTime = String(
    raw['UpdateTime'] ?? raw['更新時間'] ?? raw['update_time'] ?? ''
  );
  return r;
}

export async function fetchReservoirData(params?: {
  limit?: number;
}): Promise<{ records: ReservoirRecord[]; total: number }> {
  const url = buildDataGovUrl({ limit: params?.limit });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Reservoir API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  // data.gov.tw format
  if (data.success === true && data.result) {
    const result = data.result as Record<string, unknown>;
    const records = (result.records ?? []) as Record<string, unknown>[];
    return {
      records: records.map(normalizeRecord),
      total: (result.total as number) ?? records.length,
    };
  }

  // WRA direct format (array response)
  if (Array.isArray(data)) {
    const records = data as Record<string, unknown>[];
    return {
      records: records.map(normalizeRecord),
      total: records.length,
    };
  }

  throw new Error('Reservoir API returned unexpected response format');
}
