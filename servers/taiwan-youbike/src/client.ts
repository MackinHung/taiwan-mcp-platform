import type { CityCode, YouBikeStation } from './types.js';

export const CITY_ENDPOINTS: Record<CityCode, string> = {
  taipei: 'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json',
  new_taipei: 'https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json?size=5000',
  taoyuan: 'https://data.tycg.gov.tw/api/v1/rest/datastore/a1b4714b-3b75-4ff8-a8f2-cc377e4eaa0f?format=json',
  kaohsiung: 'https://api.kcg.gov.tw/api/service/Get/b4dd9c40-9571-4f52-bcc7-86dc2f01e6ad',
  taichung: 'https://datacenter.taichung.gov.tw/swagger/OpenData/4510d558-37e2-4480-8a22-2adab0fe1dd1',
  hsinchu: 'https://datacenter.hccg.gov.tw/swagger/OpenData/36de3cfe-3202-4911-a043-f82699115131',
};

export const VALID_CITIES: ReadonlyArray<CityCode> = [
  'taipei', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung', 'hsinchu',
];

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toString(val: unknown): string {
  if (typeof val === 'string') return val;
  return val != null ? String(val) : '';
}

function normalizeStation(raw: Record<string, unknown>): YouBikeStation {
  return {
    sno: toString(raw.sno ?? raw.StationNo ?? raw.station_no ?? ''),
    sna: toString(raw.sna ?? raw.StationName ?? raw.station_name ?? ''),
    snaen: toString(raw.snaen ?? raw.StationNameEn ?? raw.station_name_en ?? ''),
    tot: toNumber(raw.tot ?? raw.TotalDocks ?? raw.total ?? 0),
    sbi: toNumber(raw.sbi ?? raw.AvailableBikes ?? raw.available_bikes ?? 0),
    bemp: toNumber(raw.bemp ?? raw.EmptyDocks ?? raw.empty_docks ?? 0),
    lat: toNumber(raw.lat ?? raw.Latitude ?? raw.latitude ?? 0),
    lng: toNumber(raw.lng ?? raw.Longitude ?? raw.longitude ?? 0),
    ar: toString(raw.ar ?? raw.Address ?? raw.address ?? ''),
    aren: toString(raw.aren ?? raw.AddressEn ?? raw.address_en ?? ''),
    sarea: toString(raw.sarea ?? raw.District ?? raw.district ?? ''),
    sareaen: toString(raw.sareaen ?? raw.DistrictEn ?? raw.district_en ?? ''),
    act: toNumber(raw.act ?? raw.Active ?? raw.active ?? 0),
    mday: toString(raw.mday ?? raw.ModifyDate ?? raw.modify_date ?? ''),
    srcUpdateTime: toString(raw.srcUpdateTime ?? raw.SrcUpdateTime ?? raw.src_update_time ?? ''),
    updateTime: toString(raw.updateTime ?? raw.UpdateTime ?? raw.update_time ?? ''),
    infoTime: toString(raw.infoTime ?? raw.InfoTime ?? raw.info_time ?? ''),
    infoDate: toString(raw.infoDate ?? raw.InfoDate ?? raw.info_date ?? ''),
  };
}

function extractRecords(city: CityCode, data: unknown): Record<string, unknown>[] {
  // Different cities return different JSON structures
  if (Array.isArray(data)) {
    return data;
  }

  const obj = data as Record<string, unknown>;

  // Taoyuan: { success, result: { records: [...] } }
  if (city === 'taoyuan' && obj.result) {
    const result = obj.result as Record<string, unknown>;
    if (Array.isArray(result.records)) {
      return result.records as Record<string, unknown>[];
    }
  }

  // Kaohsiung: { isSuccess, data: { ... } } or { data: [...] }
  if (city === 'kaohsiung' && obj.data) {
    const d = obj.data;
    if (Array.isArray(d)) return d;
    if (typeof d === 'object' && d !== null) {
      const inner = d as Record<string, unknown>;
      if (Array.isArray(inner.retVal)) return inner.retVal as Record<string, unknown>[];
    }
  }

  // Fallback: try common wrapper patterns
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  if (Array.isArray(obj.records)) return obj.records as Record<string, unknown>[];
  if (Array.isArray(obj.retVal)) return obj.retVal as Record<string, unknown>[];

  return [];
}

export async function fetchStations(city: CityCode): Promise<YouBikeStation[]> {
  const url = CITY_ENDPOINTS[city];
  if (!url) {
    throw new Error(`不支援的城市: ${city}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${city} API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const records = extractRecords(city, data);

  return records.map(normalizeStation);
}

export interface CityStationsResult {
  city: CityCode;
  stations: YouBikeStation[];
  error?: string;
}

export async function fetchAllStations(): Promise<CityStationsResult[]> {
  const results = await Promise.allSettled(
    VALID_CITIES.map(async (city) => {
      const stations = await fetchStations(city);
      return { city, stations } as CityStationsResult;
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      city: VALID_CITIES[index],
      stations: [],
      error: (result.reason as Error).message,
    };
  });
}
