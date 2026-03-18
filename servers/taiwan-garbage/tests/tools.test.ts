import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchRealtimeLocations: vi.fn(),
  fetchSchedule: vi.fn(),
  isValidCity: vi.fn((city: string) =>
    ['taipei', 'tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung'].includes(city)
  ),
  isGpsCity: vi.fn((city: string) =>
    ['tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung'].includes(city)
  ),
  getCityLabel: vi.fn((city: string) => {
    const labels: Record<string, string> = {
      taipei: '台北市', tainan: '台南市', new_taipei: '新北市',
      taoyuan: '桃園市', kaohsiung: '高雄市', taichung: '台中市',
    };
    return labels[city] ?? city;
  }),
  SUPPORTED_GPS_CITIES: ['tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung'],
  ALL_SUPPORTED_CITIES: ['tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung', 'taipei'],
}));

import { fetchRealtimeLocations, fetchSchedule } from '../src/client.js';
import { getTruckSchedule } from '../src/tools/truck-schedule.js';
import { getRealtimeLocation } from '../src/tools/realtime-location.js';
import { getRecyclingSchedule } from '../src/tools/recycling-schedule.js';
import { searchByDistrict } from '../src/tools/district-search.js';
import { getSupportedCities } from '../src/tools/supported-cities.js';
import type { Env, GarbageSchedule, GarbageTruckLocation } from '../src/types.js';

const mockFetchRealtimeLocations = vi.mocked(fetchRealtimeLocations);
const mockFetchSchedule = vi.mocked(fetchSchedule);

const env: Env = {
  SERVER_NAME: 'taiwan-garbage',
  SERVER_VERSION: '1.0.0',
};

const sampleSchedules: GarbageSchedule[] = [
  { area: '中西區', route: '路線1', scheduleDay: '一', scheduleTime: '18:00', address: '民族路', city: '台南市' },
  { area: '中西區', route: '路線2', scheduleDay: '三', scheduleTime: '19:00', address: '中華路', city: '台南市' },
];

const sampleLocations: GarbageTruckLocation[] = [
  { area: '中西區', routeName: '路線A', carNo: 'ABC-1234', longitude: 120.2, latitude: 22.99, gpsTime: '2026-03-18 18:30', city: '台南市' },
  { area: '東區', routeName: '路線B', carNo: 'DEF-5678', longitude: 120.21, latitude: 22.98, gpsTime: '2026-03-18 18:31', city: '台南市' },
];

beforeEach(() => {
  mockFetchRealtimeLocations.mockReset();
  mockFetchSchedule.mockReset();
});

// --- get_truck_schedule ---
describe('getTruckSchedule', () => {
  it('returns schedule for a valid city', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    const result = await getTruckSchedule(env, { city: 'tainan' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('民族路');
    expect(result.content[0].text).toContain('路線1');
  });

  it('returns schedule filtered by district', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    const result = await getTruckSchedule(env, { city: 'tainan', district: '中西' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中西');
  });

  it('returns error when city is missing', async () => {
    const result = await getTruckSchedule(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('城市代碼');
  });

  it('returns error for invalid city', async () => {
    const result = await getTruckSchedule(env, { city: 'tokyo' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援');
  });

  it('handles empty results', async () => {
    mockFetchSchedule.mockResolvedValueOnce([]);
    const result = await getTruckSchedule(env, { city: 'tainan' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchSchedule.mockRejectedValueOnce(new Error('API down'));
    const result = await getTruckSchedule(env, { city: 'tainan' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- get_realtime_location ---
describe('getRealtimeLocation', () => {
  it('returns GPS locations for a GPS-capable city', async () => {
    mockFetchRealtimeLocations.mockResolvedValueOnce(sampleLocations);
    const result = await getRealtimeLocation(env, { city: 'tainan' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('ABC-1234');
    expect(result.content[0].text).toContain('GPS 資料有 1-2 分鐘延遲');
  });

  it('returns error for Taipei (no GPS)', async () => {
    const result = await getRealtimeLocation(env, { city: 'taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('台北僅提供排班');
    expect(result.content[0].text).toContain('不支援GPS即時追蹤');
  });

  it('returns error when city is missing', async () => {
    const result = await getRealtimeLocation(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('城市代碼');
  });

  it('returns error for invalid city', async () => {
    const result = await getRealtimeLocation(env, { city: 'osaka' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援');
  });

  it('handles empty GPS data', async () => {
    mockFetchRealtimeLocations.mockResolvedValueOnce([]);
    const result = await getRealtimeLocation(env, { city: 'tainan' });
    expect(result.content[0].text).toContain('沒有運行中的垃圾車');
  });

  it('handles GPS API error gracefully', async () => {
    mockFetchRealtimeLocations.mockRejectedValueOnce(new Error('GPS timeout'));
    const result = await getRealtimeLocation(env, { city: 'tainan' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('GPS timeout');
  });
});

// --- get_recycling_schedule ---
describe('getRecyclingSchedule', () => {
  it('returns recycling schedule for a valid city', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    const result = await getRecyclingSchedule(env, { city: 'tainan' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('資源回收');
  });

  it('filters recycling-specific routes when available', async () => {
    const recyclingSchedules: GarbageSchedule[] = [
      { area: '中西區', route: '資源回收路線1', scheduleDay: '一', scheduleTime: '18:00', address: '民族路', city: '台南市' },
      { area: '中西區', route: '一般路線', scheduleDay: '二', scheduleTime: '19:00', address: '中華路', city: '台南市' },
    ];
    mockFetchSchedule.mockResolvedValueOnce(recyclingSchedules);
    const result = await getRecyclingSchedule(env, { city: 'tainan' });
    expect(result.content[0].text).toContain('資源回收路線1');
    // Should not contain the general route hint since we have specific recycling routes
    expect(result.content[0].text).not.toContain('同車收運');
  });

  it('shows all schedules with note when no recycling-specific routes', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    const result = await getRecyclingSchedule(env, { city: 'tainan' });
    expect(result.content[0].text).toContain('同車收運');
  });

  it('returns error when city is missing', async () => {
    const result = await getRecyclingSchedule(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('城市代碼');
  });

  it('returns error for invalid city', async () => {
    const result = await getRecyclingSchedule(env, { city: 'berlin' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援');
  });

  it('handles empty results', async () => {
    mockFetchSchedule.mockResolvedValueOnce([]);
    const result = await getRecyclingSchedule(env, { city: 'tainan' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchSchedule.mockRejectedValueOnce(new Error('Network error'));
    const result = await getRecyclingSchedule(env, { city: 'tainan' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error');
  });
});

// --- search_by_district ---
describe('searchByDistrict', () => {
  it('returns combined schedule + GPS for a GPS-capable city', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    mockFetchRealtimeLocations.mockResolvedValueOnce(sampleLocations);
    const result = await searchByDistrict(env, { city: 'tainan', district: '中西' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('中西');
    expect(result.content[0].text).toContain('排班資訊');
    expect(result.content[0].text).toContain('即時位置');
  });

  it('returns schedule only for Taipei (no GPS section)', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    const result = await searchByDistrict(env, { city: 'taipei', district: '中正' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('排班資訊');
    expect(result.content[0].text).toContain('台北僅提供排班');
  });

  it('returns error when city is missing', async () => {
    const result = await searchByDistrict(env, { district: '中西' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('城市代碼');
  });

  it('returns error when district is missing', async () => {
    const result = await searchByDistrict(env, { city: 'tainan' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('行政區');
  });

  it('returns error for invalid city', async () => {
    const result = await searchByDistrict(env, { city: 'paris', district: '中西' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援');
  });

  it('handles schedule API error gracefully', async () => {
    mockFetchSchedule.mockRejectedValueOnce(new Error('Schedule API down'));
    mockFetchRealtimeLocations.mockResolvedValueOnce([]);
    const result = await searchByDistrict(env, { city: 'tainan', district: '中西' });
    // Should still return a result (with error note for schedule section)
    expect(result.content[0].text).toContain('取得失敗');
  });

  it('handles GPS API error gracefully', async () => {
    mockFetchSchedule.mockResolvedValueOnce(sampleSchedules);
    mockFetchRealtimeLocations.mockRejectedValueOnce(new Error('GPS down'));
    const result = await searchByDistrict(env, { city: 'tainan', district: '中西' });
    expect(result.content[0].text).toContain('排班資訊');
    expect(result.content[0].text).toContain('取得失敗');
  });
});

// --- get_supported_cities ---
describe('getSupportedCities', () => {
  it('returns list of all supported cities', async () => {
    const result = await getSupportedCities(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北市');
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('新北市');
    expect(result.content[0].text).toContain('桃園市');
    expect(result.content[0].text).toContain('高雄市');
    expect(result.content[0].text).toContain('台中市');
  });

  it('indicates GPS support per city', async () => {
    const result = await getSupportedCities(env, {});
    const text = result.content[0].text;
    expect(text).toContain('GPS 即時追蹤');
    expect(text).toContain('僅排班查詢');
  });

  it('includes Taiwan garbage truck culture note', async () => {
    const result = await getSupportedCities(env, {});
    expect(result.content[0].text).toContain('沒有公共垃圾桶');
  });

  it('notes GPS delay', async () => {
    const result = await getSupportedCities(env, {});
    expect(result.content[0].text).toContain('1-2 分鐘延遲');
  });
});
