import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  RADIATION_RESOURCE_ID: 'a2940c4a-c75c-4e69-8413-f9e00e5e87b2',
  buildUrl: vi.fn(),
  fetchRadiationData: vi.fn(),
}));

import { fetchRadiationData } from '../src/client.js';
import { getCurrentRadiation } from '../src/tools/current-radiation.js';
import { searchByRegion } from '../src/tools/search-by-region.js';
import { getRadiationAlerts } from '../src/tools/radiation-alerts.js';
import { getStationHistory } from '../src/tools/station-history.js';
import { getRadiationSummary } from '../src/tools/radiation-summary.js';
import type { Env } from '../src/types.js';

const mockFetchRadiationData = vi.mocked(fetchRadiationData);

const env: Env = {
  SERVER_NAME: 'taiwan-radiation',
  SERVER_VERSION: '1.0.0',
};

const sampleRadiation = [
  {
    stationName: '台北站',
    value: 0.057,
    measureTime: '2026-03-23 10:00',
    county: '台北市',
    district: '中正區',
    address: '台北市中正區100號',
    status: '正常',
  },
  {
    stationName: '高雄站',
    value: 0.062,
    measureTime: '2026-03-23 10:00',
    county: '高雄市',
    district: '前鎮區',
    address: '高雄市前鎮區200號',
    status: '正常',
  },
  {
    stationName: '核三廠',
    value: 0.35,
    measureTime: '2026-03-23 10:00',
    county: '屏東縣',
    district: '恆春鎮',
    address: '屏東縣恆春鎮300號',
    status: '警戒',
  },
];

beforeEach(() => {
  mockFetchRadiationData.mockReset();
});

// --- get_current_radiation ---
describe('getCurrentRadiation', () => {
  it('returns current radiation readings', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getCurrentRadiation(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北站');
    expect(result.content[0].text).toContain('0.057');
    expect(result.content[0].text).toContain('μSv/h');
  });

  it('shows total count in header', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 30 });
    const result = await getCurrentRadiation(env, {});
    expect(result.content[0].text).toContain('共 30 站');
    expect(result.content[0].text).toContain('顯示 3 站');
  });

  it('returns empty message when no data', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getCurrentRadiation(env, {});
    expect(result.content[0].text).toContain('目前無輻射監測資料');
  });

  it('respects limit parameter', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation.slice(0, 1), total: 3 });
    const result = await getCurrentRadiation(env, { limit: 1 });
    expect(result.isError).toBeUndefined();
    expect(mockFetchRadiationData).toHaveBeenCalledWith({ limit: 1 });
  });

  it('uses default limit of 20', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: [], total: 0 });
    await getCurrentRadiation(env, {});
    expect(mockFetchRadiationData).toHaveBeenCalledWith({ limit: 20 });
  });

  it('handles API error gracefully', async () => {
    mockFetchRadiationData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await getCurrentRadiation(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('displays station status', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getCurrentRadiation(env, {});
    expect(result.content[0].text).toContain('正常');
    expect(result.content[0].text).toContain('台北市');
  });
});

// --- search_by_region ---
describe('searchByRegion', () => {
  it('returns stations matching county', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await searchByRegion(env, { region: '台北' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北站');
    expect(result.content[0].text).toContain('0.057');
  });

  it('returns stations matching district', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await searchByRegion(env, { region: '恆春' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('核三廠');
  });

  it('returns no-results message when nothing matches', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await searchByRegion(env, { region: '花蓮' });
    expect(result.content[0].text).toContain('查無「花蓮」地區的輻射監測站');
  });

  it('returns error when region is empty', async () => {
    const result = await searchByRegion(env, { region: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市或地區關鍵字');
  });

  it('returns error when region is missing', async () => {
    const result = await searchByRegion(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市或地區關鍵字');
  });

  it('handles API error gracefully', async () => {
    mockFetchRadiationData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await searchByRegion(env, { region: '台北' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('shows match count in header', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await searchByRegion(env, { region: '高雄' });
    expect(result.content[0].text).toContain('共 1 站');
  });
});

// --- get_radiation_alerts ---
describe('getRadiationAlerts', () => {
  it('returns stations with alert status', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('核三廠');
    expect(result.content[0].text).toContain('0.35');
    expect(result.content[0].text).toContain('警戒');
  });

  it('returns all-normal message when no alerts', async () => {
    const normalOnly = sampleRadiation.filter((r) => r.status === '正常' && r.value <= 0.2);
    mockFetchRadiationData.mockResolvedValueOnce({ records: normalOnly, total: 2 });
    const result = await getRadiationAlerts(env, {});
    expect(result.content[0].text).toContain('皆正常');
  });

  it('includes stations exceeding threshold even if status is normal', async () => {
    const highNormal = [
      { ...sampleRadiation[0], value: 0.25, status: '正常' },
    ];
    mockFetchRadiationData.mockResolvedValueOnce({ records: highNormal, total: 1 });
    const result = await getRadiationAlerts(env, {});
    expect(result.content[0].text).toContain('台北站');
    expect(result.content[0].text).toContain('0.25');
  });

  it('handles API error gracefully', async () => {
    mockFetchRadiationData.mockRejectedValueOnce(new Error('server error'));
    const result = await getRadiationAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('shows alert count in header', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationAlerts(env, {});
    expect(result.content[0].text).toContain('共 1 站');
  });
});

// --- get_station_history ---
describe('getStationHistory', () => {
  it('returns data for matching station', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getStationHistory(env, { stationName: '台北站' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北站');
    expect(result.content[0].text).toContain('0.057');
  });

  it('supports partial station name match', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getStationHistory(env, { stationName: '核三' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('核三廠');
  });

  it('returns no-results for non-existent station', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getStationHistory(env, { stationName: '不存在站' });
    expect(result.content[0].text).toContain('查無監測站「不存在站」的資料');
  });

  it('returns error when stationName is empty', async () => {
    const result = await getStationHistory(env, { stationName: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供監測站名稱');
  });

  it('returns error when stationName is missing', async () => {
    const result = await getStationHistory(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供監測站名稱');
  });

  it('handles API error gracefully', async () => {
    mockFetchRadiationData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getStationHistory(env, { stationName: '台北站' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });

  it('shows record count in header', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getStationHistory(env, { stationName: '台北站' });
    expect(result.content[0].text).toContain('共 1 筆');
  });
});

// --- get_radiation_summary ---
describe('getRadiationSummary', () => {
  it('returns statistics summary', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationSummary(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('全台輻射監測統計摘要');
    expect(text).toContain('平均值');
    expect(text).toContain('最高值');
    expect(text).toContain('最低值');
  });

  it('shows correct max station', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationSummary(env, {});
    expect(result.content[0].text).toContain('核三廠');
    expect(result.content[0].text).toContain('0.3500');
  });

  it('shows correct min station', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationSummary(env, {});
    expect(result.content[0].text).toContain('台北站');
    expect(result.content[0].text).toContain('0.0570');
  });

  it('groups by county', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationSummary(env, {});
    const text = result.content[0].text;
    expect(text).toContain('台北市');
    expect(text).toContain('高雄市');
    expect(text).toContain('屏東縣');
  });

  it('shows alert count', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationSummary(env, {});
    expect(result.content[0].text).toContain('異常/警戒站數: 1');
  });

  it('returns empty message when no data', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRadiationSummary(env, {});
    expect(result.content[0].text).toContain('目前無輻射監測資料可供統計');
  });

  it('handles API error gracefully', async () => {
    mockFetchRadiationData.mockRejectedValueOnce(new Error('API down'));
    const result = await getRadiationSummary(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('calculates correct average', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });
    const result = await getRadiationSummary(env, {});
    // avg = (0.057 + 0.062 + 0.35) / 3 = 0.1563...
    expect(result.content[0].text).toContain('0.1563');
  });
});
