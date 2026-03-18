import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  CITY_ENDPOINTS: {
    taipei: 'https://example.com/taipei',
    new_taipei: 'https://example.com/new_taipei',
    taoyuan: 'https://example.com/taoyuan',
    kaohsiung: 'https://example.com/kaohsiung',
    taichung: 'https://example.com/taichung',
    hsinchu: 'https://example.com/hsinchu',
  },
  VALID_CITIES: ['taipei', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung', 'hsinchu'],
  fetchStations: vi.fn(),
  fetchAllStations: vi.fn(),
}));

import { fetchStations, fetchAllStations } from '../src/client.js';
import { getStationAvailability } from '../src/tools/station-availability.js';
import { searchNearbyStations } from '../src/tools/nearby-stations.js';
import { searchByDistrict } from '../src/tools/district-search.js';
import { getCityOverview } from '../src/tools/city-overview.js';
import { getLowAvailabilityAlerts } from '../src/tools/low-availability.js';
import type { Env, YouBikeStation } from '../src/types.js';

const mockFetchStations = vi.mocked(fetchStations);
const mockFetchAllStations = vi.mocked(fetchAllStations);

const env: Env = {
  SERVER_NAME: 'taiwan-youbike',
  SERVER_VERSION: '1.0.0',
};

function makeStation(overrides: Partial<YouBikeStation> = {}): YouBikeStation {
  return {
    sno: '500101001',
    sna: 'YouBike2.0_捷運市政府站',
    snaen: 'YouBike2.0_MRT Taipei City Hall Sta.',
    tot: 50,
    sbi: 20,
    bemp: 30,
    lat: 25.0408,
    lng: 121.5676,
    ar: '忠孝東路五段',
    aren: 'Zhongxiao E. Rd.',
    sarea: '信義區',
    sareaen: 'Xinyi Dist.',
    act: 1,
    mday: '2026-03-18 10:00:00',
    srcUpdateTime: '2026-03-18 10:00:00',
    updateTime: '2026-03-18 10:00:00',
    infoTime: '2026-03-18 10:00:00',
    infoDate: '2026-03-18',
    ...overrides,
  };
}

beforeEach(() => {
  mockFetchStations.mockReset();
  mockFetchAllStations.mockReset();
});

// --- get_station_availability ---
describe('getStationAvailability', () => {
  it('returns station info for matching station name', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation(),
      makeStation({ sna: '捷運國父紀念館站', sno: '500101002' }),
    ]);

    const result = await getStationAvailability(env, { city: 'taipei', stationName: '市政府' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('市政府');
    expect(result.content[0].text).toContain('可借車輛: 20');
    expect(result.content[0].text).toContain('1 個站點');
  });

  it('matches by English name', async () => {
    mockFetchStations.mockResolvedValueOnce([makeStation()]);

    const result = await getStationAvailability(env, { city: 'taipei', stationName: 'City Hall' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('City Hall');
  });

  it('returns empty message when no match found', async () => {
    mockFetchStations.mockResolvedValueOnce([makeStation()]);

    const result = await getStationAvailability(env, { city: 'taipei', stationName: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error for invalid city', async () => {
    const result = await getStationAvailability(env, { city: 'invalid', stationName: 'test' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('有效的城市代碼');
  });

  it('returns error for missing stationName', async () => {
    const result = await getStationAvailability(env, { city: 'taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('站名');
  });

  it('returns error for empty stationName', async () => {
    const result = await getStationAvailability(env, { city: 'taipei', stationName: '  ' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchStations.mockRejectedValueOnce(new Error('API down'));

    const result = await getStationAvailability(env, { city: 'taipei', stationName: '市政府' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- search_nearby_stations ---
describe('searchNearbyStations', () => {
  it('returns stations within radius sorted by distance', async () => {
    const nearStation = makeStation({ lat: 25.041, lng: 121.568, sna: '近站' });
    const farStation = makeStation({ lat: 25.050, lng: 121.580, sna: '遠站' });

    mockFetchAllStations.mockResolvedValueOnce([
      { city: 'taipei', stations: [nearStation, farStation] },
    ]);

    const result = await searchNearbyStations(env, { lat: 25.0408, lng: 121.5676, radiusKm: 2 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('近站');
    // Near station should appear first
    const text = result.content[0].text;
    expect(text.indexOf('近站')).toBeLessThan(text.indexOf('遠站'));
  });

  it('returns empty message when no stations within radius', async () => {
    const farStation = makeStation({ lat: 26.0, lng: 122.0 });
    mockFetchAllStations.mockResolvedValueOnce([
      { city: 'taipei', stations: [farStation] },
    ]);

    const result = await searchNearbyStations(env, { lat: 25.0408, lng: 121.5676, radiusKm: 0.1 });
    expect(result.content[0].text).toContain('找不到');
  });

  it('uses default radius of 0.5 km', async () => {
    // Station very close (within 0.5km)
    const closeStation = makeStation({ lat: 25.041, lng: 121.568 });
    mockFetchAllStations.mockResolvedValueOnce([
      { city: 'taipei', stations: [closeStation] },
    ]);

    const result = await searchNearbyStations(env, { lat: 25.0408, lng: 121.5676 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('0.5 km');
  });

  it('returns error for missing lat', async () => {
    const result = await searchNearbyStations(env, { lng: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('緯度');
  });

  it('returns error for missing lng', async () => {
    const result = await searchNearbyStations(env, { lat: 25.0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('經度');
  });

  it('returns error for invalid lat range', async () => {
    const result = await searchNearbyStations(env, { lat: 95, lng: 121.5 });
    expect(result.isError).toBe(true);
  });

  it('returns error for invalid radius', async () => {
    const result = await searchNearbyStations(env, { lat: 25.0, lng: 121.5, radiusKm: -1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('半徑');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllStations.mockRejectedValueOnce(new Error('Network error'));

    const result = await searchNearbyStations(env, { lat: 25.0, lng: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error');
  });
});

// --- search_by_district ---
describe('searchByDistrict', () => {
  it('returns stations in matching district', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sarea: '信義區', sna: '站A' }),
      makeStation({ sarea: '大安區', sna: '站B' }),
      makeStation({ sarea: '信義區', sna: '站C' }),
    ]);

    const result = await searchByDistrict(env, { city: 'taipei', district: '信義區' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('2 個站點');
    expect(result.content[0].text).toContain('站A');
    expect(result.content[0].text).toContain('站C');
    expect(result.content[0].text).not.toContain('站B');
  });

  it('returns empty message when no match', async () => {
    mockFetchStations.mockResolvedValueOnce([makeStation({ sarea: '信義區' })]);

    const result = await searchByDistrict(env, { city: 'taipei', district: '不存在區' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error for invalid city', async () => {
    const result = await searchByDistrict(env, { city: 'mars', district: '大安區' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('有效的城市代碼');
  });

  it('returns error for missing district', async () => {
    const result = await searchByDistrict(env, { city: 'taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('行政區');
  });

  it('handles API error gracefully', async () => {
    mockFetchStations.mockRejectedValueOnce(new Error('Timeout'));

    const result = await searchByDistrict(env, { city: 'taipei', district: '信義區' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Timeout');
  });
});

// --- get_city_overview ---
describe('getCityOverview', () => {
  it('returns city summary statistics', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 10, bemp: 5, tot: 15, sarea: '信義區', act: 1 }),
      makeStation({ sbi: 8, bemp: 12, tot: 20, sarea: '大安區', act: 1 }),
      makeStation({ sbi: 0, bemp: 10, tot: 10, sarea: '信義區', act: 0 }),
    ]);

    const result = await getCityOverview(env, { city: 'taipei' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('站點總數: 3');
    expect(text).toContain('營運中: 2');
    expect(text).toContain('總可借車輛: 18');
    expect(text).toContain('總可還空位: 27');
    expect(text).toContain('信義區');
    expect(text).toContain('大安區');
  });

  it('returns empty message when no stations', async () => {
    mockFetchStations.mockResolvedValueOnce([]);

    const result = await getCityOverview(env, { city: 'taipei' });
    expect(result.content[0].text).toContain('沒有');
  });

  it('returns error for invalid city', async () => {
    const result = await getCityOverview(env, { city: 'invalid' });
    expect(result.isError).toBe(true);
  });

  it('returns error for missing city', async () => {
    const result = await getCityOverview(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchStations.mockRejectedValueOnce(new Error('Server down'));

    const result = await getCityOverview(env, { city: 'taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server down');
  });
});

// --- get_low_availability_alerts ---
describe('getLowAvailabilityAlerts', () => {
  it('returns stations with bikes below threshold', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 0, sna: '空站', act: 1 }),
      makeStation({ sbi: 2, sna: '快空站', act: 1 }),
      makeStation({ sbi: 10, sna: '充足站', act: 1 }),
      makeStation({ sbi: 1, sna: '停用站', act: 0 }),
    ]);

    const result = await getLowAvailabilityAlerts(env, { city: 'taipei', threshold: 3 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('空站');
    expect(text).toContain('快空站');
    expect(text).not.toContain('充足站');
    expect(text).not.toContain('停用站'); // inactive stations excluded
    expect(text).toContain('2 / 3'); // 2 low out of 3 active
  });

  it('uses default threshold of 3', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 2, sna: '低站', act: 1 }),
      makeStation({ sbi: 5, sna: '高站', act: 1 }),
    ]);

    const result = await getLowAvailabilityAlerts(env, { city: 'taipei' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('低站');
    expect(result.content[0].text).not.toContain('高站');
  });

  it('returns no alert message when all above threshold', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 10, act: 1 }),
      makeStation({ sbi: 20, act: 1 }),
    ]);

    const result = await getLowAvailabilityAlerts(env, { city: 'taipei', threshold: 3 });
    expect(result.content[0].text).toContain('沒有');
  });

  it('returns error for invalid city', async () => {
    const result = await getLowAvailabilityAlerts(env, { city: 'bad' });
    expect(result.isError).toBe(true);
  });

  it('returns error for invalid threshold', async () => {
    const result = await getLowAvailabilityAlerts(env, { city: 'taipei', threshold: -1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('門檻');
  });

  it('handles API error gracefully', async () => {
    mockFetchStations.mockRejectedValueOnce(new Error('API timeout'));

    const result = await getLowAvailabilityAlerts(env, { city: 'taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('sorts by available bikes ascending', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 2, sna: '站B', act: 1 }),
      makeStation({ sbi: 0, sna: '站A', act: 1 }),
      makeStation({ sbi: 1, sna: '站C', act: 1 }),
    ]);

    const result = await getLowAvailabilityAlerts(env, { city: 'taipei', threshold: 3 });
    const text = result.content[0].text;
    // 站A (0) should come before 站C (1) should come before 站B (2)
    expect(text.indexOf('站A')).toBeLessThan(text.indexOf('站C'));
    expect(text.indexOf('站C')).toBeLessThan(text.indexOf('站B'));
  });
});
