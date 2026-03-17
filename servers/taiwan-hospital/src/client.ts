import type { FacilityRecord, NhiResponse } from './types.js';

const BASE_URL = 'https://info.nhi.gov.tw/api/iode0010/v1/rest/datastore';

export interface FacilityType {
  id: string;
  name: string;
  resourceId: string;
}

export const FACILITY_TYPES: FacilityType[] = [
  { id: 'medical_center', name: '醫學中心', resourceId: 'A21030000I-D21001-003' },
  { id: 'regional_hospital', name: '區域醫院', resourceId: 'A21030000I-D21002-005' },
  { id: 'district_hospital', name: '地區醫院', resourceId: 'A21030000I-D21003-003' },
  { id: 'clinic', name: '診所', resourceId: 'A21030000I-D21004-009' },
  { id: 'pharmacy', name: '藥局', resourceId: 'A21030000I-D21005-001' },
];

export const AREA_CODES: Record<string, string> = {
  '台北市': '63000', '新北市': '65000', '桃園市': '68000',
  '台中市': '66000', '台南市': '67000', '高雄市': '64000',
  '基隆市': '10017', '新竹市': '10018', '嘉義市': '10020',
  '新竹縣': '10004', '苗栗縣': '10005', '彰化縣': '10007',
  '南投縣': '10008', '雲林縣': '10009', '嘉義縣': '10010',
  '屏東縣': '10013', '宜蘭縣': '10002', '花蓮縣': '10015',
  '台東縣': '10014', '澎湖縣': '10016', '金門縣': '09020',
  '連江縣': '09007',
};

export async function fetchFacilities(
  resourceId: string,
  options: { limit?: number; offset?: number; filters?: Record<string, string> } = {}
): Promise<FacilityRecord[]> {
  const limit = Math.min(options.limit ?? 100, 1000);
  const offset = options.offset ?? 0;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (options.filters && Object.keys(options.filters).length > 0) {
    params.set('filters', JSON.stringify(options.filters));
  }

  const url = `${BASE_URL}/${resourceId}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NHI API error: ${response.status}`);
  }

  const data = (await response.json()) as NhiResponse;

  if (!data.success) {
    throw new Error('NHI API returned success=false');
  }

  return data.result.records;
}

export async function searchFacilitiesByName(
  resourceId: string,
  name: string,
  limit: number = 20
): Promise<FacilityRecord[]> {
  const records = await fetchFacilities(resourceId, {
    limit: Math.min(limit * 5, 1000),
    filters: { HOSP_NAME: name },
  });
  return records.slice(0, limit);
}

export async function fetchMultipleTypes(
  resourceIds: string[],
  options: { limit?: number; filters?: Record<string, string> } = {}
): Promise<FacilityRecord[]> {
  const results = await Promise.allSettled(
    resourceIds.map((rid) => fetchFacilities(rid, options))
  );

  const items: FacilityRecord[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      items.push(...r.value);
    }
  }

  return items;
}
