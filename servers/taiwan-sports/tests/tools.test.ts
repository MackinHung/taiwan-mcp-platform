import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  SPORT_TYPES: ['籃球', '游泳', '健身', '足球', '棒球', '網球', '羽球', '桌球', '田徑', '高爾夫'],
  CITIES: ['臺北市', '新北市', '桃園市'],
  getAllFacilities: vi.fn(),
  searchByCity: vi.fn(),
  searchBySportType: vi.fn(),
  searchByKeyword: vi.fn(),
  searchFacilities: vi.fn(),
  findFacilityByName: vi.fn(),
  searchNearby: vi.fn(),
  getSportTypeSummary: vi.fn(),
  haversineDistance: vi.fn(),
}));

import {
  searchFacilities as mockSearchFacilities,
  findFacilityByName as mockFindByName,
  searchNearby as mockSearchNearby,
  searchByCity as mockSearchByCity,
  getSportTypeSummary as mockGetSportTypes,
  getAllFacilities as mockGetAll,
} from '../src/client.js';
import { searchFacilitiesTool } from '../src/tools/search-facilities.js';
import { searchNearbyTool } from '../src/tools/nearby-facilities.js';
import { getFacilityDetails } from '../src/tools/facility-details.js';
import { searchByCityTool } from '../src/tools/city-search.js';
import { getSportTypes } from '../src/tools/sport-types.js';
import type { Env, FacilityRecord } from '../src/types.js';

const mockSearchFacilitiesFn = vi.mocked(mockSearchFacilities);
const mockFindByNameFn = vi.mocked(mockFindByName);
const mockSearchNearbyFn = vi.mocked(mockSearchNearby);
const mockSearchByCityFn = vi.mocked(mockSearchByCity);
const mockGetSportTypesFn = vi.mocked(mockGetSportTypes);
const mockGetAllFn = vi.mocked(mockGetAll);

const env: Env = {
  SERVER_NAME: 'taiwan-sports',
  SERVER_VERSION: '1.0.0',
};

const sampleFacility: FacilityRecord = {
  id: 'TPE-001',
  name: '臺北小巨蛋',
  address: '臺北市松山區南京東路四段2號',
  phone: '02-25781536',
  city: '臺北市',
  district: '松山區',
  sportTypes: ['籃球', '游泳', '健身'],
  openHours: '06:00-22:00',
  fee: '依場館公告',
  lat: 25.0512,
  lng: 121.5498,
  facilities: '室內籃球場、游泳池、健身房',
};

const sampleFacility2: FacilityRecord = {
  id: 'TPE-002',
  name: '臺北市立大安運動中心',
  address: '臺北市大安區辛亥路三段55號',
  phone: '02-23770300',
  city: '臺北市',
  district: '大安區',
  sportTypes: ['游泳', '健身', '羽球'],
  openHours: '06:00-22:00',
  fee: '游泳全票100元',
  lat: 25.0211,
  lng: 121.5368,
  facilities: '游泳池、健身房、羽球場',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// --- search_facilities ---
describe('searchFacilitiesTool', () => {
  it('returns results for sportType search', async () => {
    mockSearchFacilitiesFn.mockReturnValue([sampleFacility]);
    const result = await searchFacilitiesTool(env, { sportType: '籃球' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北小巨蛋');
    expect(result.content[0].text).toContain('籃球');
  });

  it('returns results for city search', async () => {
    mockSearchFacilitiesFn.mockReturnValue([sampleFacility, sampleFacility2]);
    const result = await searchFacilitiesTool(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 2 間場館');
  });

  it('returns results for keyword search', async () => {
    mockSearchFacilitiesFn.mockReturnValue([sampleFacility]);
    const result = await searchFacilitiesTool(env, { keyword: '巨蛋' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北小巨蛋');
  });

  it('returns results for combined filters', async () => {
    mockSearchFacilitiesFn.mockReturnValue([sampleFacility2]);
    const result = await searchFacilitiesTool(env, {
      sportType: '游泳',
      city: '臺北市',
      keyword: '運動中心',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大安運動中心');
  });

  it('returns error when no search params provided', async () => {
    const result = await searchFacilitiesTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請至少提供一個搜尋條件');
  });

  it('returns no-result message for empty results', async () => {
    mockSearchFacilitiesFn.mockReturnValue([]);
    const result = await searchFacilitiesTool(env, { sportType: '衝浪' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無符合條件');
  });

  it('includes open hours and fee in output', async () => {
    mockSearchFacilitiesFn.mockReturnValue([sampleFacility]);
    const result = await searchFacilitiesTool(env, { sportType: '籃球' });
    expect(result.content[0].text).toContain('06:00-22:00');
    expect(result.content[0].text).toContain('依場館公告');
  });
});

// --- search_nearby ---
describe('searchNearbyTool', () => {
  it('returns nearby facilities', async () => {
    mockSearchNearbyFn.mockReturnValue([
      { ...sampleFacility, distanceKm: 0.5 },
    ]);
    const result = await searchNearbyTool(env, { lat: 25.0512, lng: 121.5498 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北小巨蛋');
    expect(result.content[0].text).toContain('0.5 km');
  });

  it('returns error when lat is missing', async () => {
    const result = await searchNearbyTool(env, { lng: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('緯度');
  });

  it('returns error when lng is missing', async () => {
    const result = await searchNearbyTool(env, { lat: 25.0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('經度');
  });

  it('returns error for out-of-Taiwan coordinates', async () => {
    const result = await searchNearbyTool(env, { lat: 35.0, lng: 139.0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('台灣範圍');
  });

  it('returns error for negative radius', async () => {
    const result = await searchNearbyTool(env, { lat: 25.0, lng: 121.5, radiusKm: -1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('搜尋半徑');
  });

  it('returns error for radius exceeding max', async () => {
    const result = await searchNearbyTool(env, { lat: 25.0, lng: 121.5, radiusKm: 100 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('50');
  });

  it('returns no-result message for empty area', async () => {
    mockSearchNearbyFn.mockReturnValue([]);
    const result = await searchNearbyTool(env, { lat: 22.0, lng: 120.0, radiusKm: 1 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無');
  });

  it('uses default 2km radius when not specified', async () => {
    mockSearchNearbyFn.mockReturnValue([]);
    await searchNearbyTool(env, { lat: 25.0, lng: 121.5 });
    expect(mockSearchNearbyFn).toHaveBeenCalledWith(25.0, 121.5, 2);
  });
});

// --- get_facility_details ---
describe('getFacilityDetails', () => {
  it('returns facility details', async () => {
    mockFindByNameFn.mockReturnValue(sampleFacility);
    const result = await getFacilityDetails(env, { name: '臺北小巨蛋' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed['名稱']).toBe('臺北小巨蛋');
    expect(parsed['地址']).toContain('南京東路');
    expect(parsed['電話']).toBe('02-25781536');
    expect(parsed['運動項目']).toContain('籃球');
  });

  it('returns error when name is missing', async () => {
    const result = await getFacilityDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供場館名稱');
  });

  it('returns error when name is empty string', async () => {
    const result = await getFacilityDetails(env, { name: '' });
    expect(result.isError).toBe(true);
  });

  it('returns error when name is whitespace only', async () => {
    const result = await getFacilityDetails(env, { name: '   ' });
    expect(result.isError).toBe(true);
  });

  it('returns not-found message for unknown facility', async () => {
    mockFindByNameFn.mockReturnValue(undefined);
    const result = await getFacilityDetails(env, { name: '不存在的場館' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無');
  });

  it('includes coordinate in detail output', async () => {
    mockFindByNameFn.mockReturnValue(sampleFacility);
    const result = await getFacilityDetails(env, { name: '臺北小巨蛋' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed['座標']['緯度']).toBe(25.0512);
    expect(parsed['座標']['經度']).toBe(121.5498);
  });
});

// --- search_by_city ---
describe('searchByCityTool', () => {
  it('returns facilities for a city', async () => {
    mockSearchByCityFn.mockReturnValue([sampleFacility, sampleFacility2]);
    const result = await searchByCityTool(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('共 2 間');
  });

  it('includes sport type statistics', async () => {
    mockSearchByCityFn.mockReturnValue([sampleFacility, sampleFacility2]);
    const result = await searchByCityTool(env, { city: '臺北市' });
    expect(result.content[0].text).toContain('運動項目統計');
    expect(result.content[0].text).toContain('游泳');
  });

  it('returns error when city is missing', async () => {
    const result = await searchByCityTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市名稱');
  });

  it('returns error when city is empty', async () => {
    const result = await searchByCityTool(env, { city: '' });
    expect(result.isError).toBe(true);
  });

  it('returns not-found for unknown city', async () => {
    mockSearchByCityFn.mockReturnValue([]);
    const result = await searchByCityTool(env, { city: '火星市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無');
  });

  it('includes district info in results', async () => {
    mockSearchByCityFn.mockReturnValue([sampleFacility]);
    const result = await searchByCityTool(env, { city: '臺北市' });
    expect(result.content[0].text).toContain('松山區');
  });
});

// --- get_sport_types ---
describe('getSportTypes', () => {
  it('returns sport type summary', async () => {
    mockGetSportTypesFn.mockReturnValue([
      { sportType: '籃球', count: 10 },
      { sportType: '游泳', count: 8 },
      { sportType: '健身', count: 6 },
    ]);
    mockGetAllFn.mockReturnValue(new Array(20));
    const result = await getSportTypes(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('籃球');
    expect(result.content[0].text).toContain('10 間場館');
    expect(result.content[0].text).toContain('游泳');
  });

  it('includes total facility count', async () => {
    mockGetSportTypesFn.mockReturnValue([
      { sportType: '籃球', count: 5 },
    ]);
    mockGetAllFn.mockReturnValue(new Array(30));
    const result = await getSportTypes(env, {});
    expect(result.content[0].text).toContain('共 30 間場館');
  });

  it('works with empty summary', async () => {
    mockGetSportTypesFn.mockReturnValue([]);
    mockGetAllFn.mockReturnValue([]);
    const result = await getSportTypes(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 0 間場館');
  });

  it('does not require any arguments', async () => {
    mockGetSportTypesFn.mockReturnValue([
      { sportType: '籃球', count: 3 },
    ]);
    mockGetAllFn.mockReturnValue(new Array(10));
    const result = await getSportTypes(env, {});
    expect(result.isError).toBeUndefined();
  });
});
