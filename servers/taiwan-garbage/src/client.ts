import type { Env, GarbageTruckLocation, GarbageSchedule, SupportedCity } from './types.js';

// Cities with GPS real-time tracking (Taipei is schedule-only)
export const SUPPORTED_GPS_CITIES: readonly SupportedCity[] = [
  'tainan',
  'new_taipei',
  'taoyuan',
  'kaohsiung',
  'taichung',
] as const;

export const ALL_SUPPORTED_CITIES: readonly SupportedCity[] = [
  ...SUPPORTED_GPS_CITIES,
  'taipei',
] as const;

const CITY_LABELS: Record<SupportedCity, string> = {
  tainan: '台南市',
  new_taipei: '新北市',
  taoyuan: '桃園市',
  kaohsiung: '高雄市',
  taichung: '台中市',
  taipei: '台北市',
};

// MOENV consolidated garbage truck GPS endpoint
const MOENV_GPS_BASE = 'https://data.moenv.gov.tw/api/v2/138256';
const DEFAULT_MOENV_KEY = 'e8dd42e6-9b8b-43f8-991e-b3dee723a52d'; // public demo key

// Taipei schedule endpoint (data.taipei)
const TAIPEI_SCHEDULE_URL =
  'https://data.taipei/api/v1/dataset/6bb3304b-4f46-434a-bddc-3ed5a337b7a2?scope=resourceAquire';

// data.gov.tw schedule base
const SCHEDULE_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Schedule resource IDs per city
const SCHEDULE_RESOURCE_IDS: Partial<Record<SupportedCity, string>> = {
  tainan: '382000000A-002158-001',
  new_taipei: '382000000A-002159-001',
  taoyuan: '382000000A-002160-001',
  kaohsiung: '382000000A-002161-001',
  taichung: '382000000A-002162-001',
};

export function getCityLabel(city: SupportedCity): string {
  return CITY_LABELS[city] ?? city;
}

export function isValidCity(city: string): city is SupportedCity {
  return ALL_SUPPORTED_CITIES.includes(city as SupportedCity);
}

export function isGpsCity(city: SupportedCity): boolean {
  return SUPPORTED_GPS_CITIES.includes(city);
}

interface MoenvGpsRecord {
  car: string;
  time: string;
  lng: string;
  lat: string;
  duty: string;
  linename: string;
  city: string;
  area: string;
}

interface MoenvGpsResponse {
  records: MoenvGpsRecord[];
  total: number;
}

function normalizeCityFilter(city: SupportedCity): string {
  return CITY_LABELS[city];
}

function normalizeGpsRecord(record: MoenvGpsRecord, city: SupportedCity): GarbageTruckLocation {
  return {
    area: record.area ?? '',
    routeName: record.linename ?? '',
    carNo: record.car ?? '',
    longitude: parseFloat(record.lng) || 0,
    latitude: parseFloat(record.lat) || 0,
    gpsTime: record.time ?? '',
    city: getCityLabel(city),
  };
}

export async function fetchRealtimeLocations(
  city?: SupportedCity,
  env?: Env
): Promise<GarbageTruckLocation[]> {
  const apiKey = env?.MOENV_API_KEY ?? DEFAULT_MOENV_KEY;
  const url = new URL(MOENV_GPS_BASE);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('limit', '1000');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`GPS API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as MoenvGpsResponse;

  if (!data.records) {
    throw new Error('GPS API returned no records');
  }

  let records = data.records;

  // Filter by city if specified
  if (city) {
    const cityLabel = normalizeCityFilter(city);
    records = records.filter(
      (r) => r.city === cityLabel || r.area?.includes(cityLabel.replace('市', ''))
    );
  }

  return records.map((r) => normalizeGpsRecord(r, city ?? 'tainan'));
}

interface TaipeiScheduleRecord {
  行政區: string;
  路線: string;
  星期: string;
  抵達時間: string;
  地點: string;
}

interface TaipeiScheduleResponse {
  result: {
    results: TaipeiScheduleRecord[];
    count: number;
  };
}

interface DataGovScheduleRecord {
  area: string;
  route: string;
  day: string;
  time: string;
  address: string;
}

interface DataGovScheduleResponse {
  success: boolean;
  result: {
    records: DataGovScheduleRecord[];
    total: number;
  };
}

function normalizeTaipeiSchedule(record: TaipeiScheduleRecord): GarbageSchedule {
  return {
    area: record['行政區'] ?? '',
    route: record['路線'] ?? '',
    scheduleDay: record['星期'] ?? '',
    scheduleTime: record['抵達時間'] ?? '',
    address: record['地點'] ?? '',
    city: '台北市',
  };
}

function normalizeDataGovSchedule(
  record: DataGovScheduleRecord,
  city: SupportedCity
): GarbageSchedule {
  return {
    area: record.area ?? '',
    route: record.route ?? '',
    scheduleDay: record.day ?? '',
    scheduleTime: record.time ?? '',
    address: record.address ?? '',
    city: getCityLabel(city),
  };
}

export async function fetchSchedule(
  city: SupportedCity,
  district?: string
): Promise<GarbageSchedule[]> {
  if (city === 'taipei') {
    return fetchTaipeiSchedule(district);
  }
  return fetchDataGovSchedule(city, district);
}

async function fetchTaipeiSchedule(district?: string): Promise<GarbageSchedule[]> {
  const url = new URL(TAIPEI_SCHEDULE_URL);
  url.searchParams.set('limit', '1000');
  if (district) {
    url.searchParams.set('q', district);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Taipei Schedule API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TaipeiScheduleResponse;

  if (!data.result?.results) {
    throw new Error('Taipei Schedule API returned no results');
  }

  let results = data.result.results;

  if (district) {
    results = results.filter(
      (r) => r['行政區']?.includes(district)
    );
  }

  return results.map(normalizeTaipeiSchedule);
}

async function fetchDataGovSchedule(
  city: SupportedCity,
  district?: string
): Promise<GarbageSchedule[]> {
  const resourceId = SCHEDULE_RESOURCE_IDS[city];
  if (!resourceId) {
    throw new Error(`No schedule data available for ${getCityLabel(city)}`);
  }

  const url = new URL(`${SCHEDULE_BASE}/${resourceId}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1000');
  if (district) {
    url.searchParams.set('filters', JSON.stringify({ area: district }));
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Schedule API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as DataGovScheduleResponse;

  if (!data.success) {
    throw new Error('Schedule API returned unsuccessful response');
  }

  const records = data.result?.records ?? [];

  return records.map((r) => normalizeDataGovSchedule(r, city));
}
