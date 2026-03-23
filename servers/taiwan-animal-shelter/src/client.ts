import type { AnimalRecord, OpenDataResponse } from './types.js';

const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';
export const ANIMAL_RESOURCE_ID = 'b215d58c-3459-44ef-a3f2-4a3be01a9e18';

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

const FIELD_MAP: Record<string, keyof AnimalRecord> = {
  '動物的流水編號': 'animalId',
  '動物的區域編號': 'areaId',
  '動物品種': 'breed',
  '動物種類': 'species',
  '動物性別': 'sex',
  '動物體型': 'bodySize',
  '動物毛色': 'color',
  '動物年齡': 'age',
  '動物狀態': 'status',
  '動物所在地': 'location',
  '收容所名稱': 'shelterName',
  '收容所地址': 'shelterAddress',
  '收容所電話': 'shelterPhone',
  '資料異動時間': 'updateTime',
  '圖片': 'imageUrl',
};

function normalizeRecord(raw: Record<string, string>): AnimalRecord {
  const record: Partial<AnimalRecord> = {};
  for (const [chineseKey, englishKey] of Object.entries(FIELD_MAP)) {
    (record as Record<string, unknown>)[englishKey] = raw[chineseKey] ?? '';
  }
  return {
    animalId: record.animalId ?? '',
    areaId: record.areaId ?? '',
    breed: record.breed ?? '',
    species: record.species ?? '',
    sex: record.sex ?? '',
    bodySize: record.bodySize ?? '',
    color: record.color ?? '',
    age: record.age ?? '',
    status: record.status ?? '',
    location: record.location ?? '',
    shelterName: record.shelterName ?? '',
    shelterAddress: record.shelterAddress ?? '',
    shelterPhone: record.shelterPhone ?? '',
    updateTime: record.updateTime ?? '',
    imageUrl: record.imageUrl ?? '',
  };
}

export async function fetchAnimalData(
  params?: { status?: string; species?: string; limit?: number; offset?: number }
): Promise<{ records: AnimalRecord[]; total: number }> {
  const filters: Record<string, string> = {};
  if (params?.status) filters['動物狀態'] = params.status;
  if (params?.species) filters['動物種類'] = params.species;
  const url = buildUrl(ANIMAL_RESOURCE_ID, {
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
