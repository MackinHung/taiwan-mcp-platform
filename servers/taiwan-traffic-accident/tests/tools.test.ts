import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  ACCIDENT_RESOURCE_ID: '73a7a8f6-0e39-4d18-a1c3-36ff3ddb6e42',
  buildUrl: vi.fn(),
  fetchAccidents: vi.fn(),
}));

import { fetchAccidents } from '../src/client.js';
import { getRecentAccidents } from '../src/tools/recent-accidents.js';
import { searchByLocation } from '../src/tools/search-location.js';
import { getAccidentStats } from '../src/tools/accident-stats.js';
import { getDangerousIntersections } from '../src/tools/dangerous-intersections.js';
import { getHistoricalTrends } from '../src/tools/historical-trends.js';
import type { Env } from '../src/types.js';

const mockFetchAccidents = vi.mocked(fetchAccidents);

const env: Env = {
  SERVER_NAME: 'taiwan-traffic-accident',
  SERVER_VERSION: '1.0.0',
};

const sampleRecords = [
  {
    occurDate: '2026/01/15',
    occurTime: '08:30',
    county: '臺北市',
    district: '中正區',
    address: '忠孝東路一段',
    accidentType: 'A2',
    deathCount: 0,
    injuryCount: 2,
    vehicleTypes: '機車-自小客',
    weatherCondition: '晴',
    roadCondition: '乾燥',
    lightCondition: '日間',
    cause: '未注意車前狀況',
  },
  {
    occurDate: '2026/01/16',
    occurTime: '14:00',
    county: '臺北市',
    district: '大安區',
    address: '復興南路一段',
    accidentType: 'A2',
    deathCount: 0,
    injuryCount: 1,
    vehicleTypes: '自小客',
    weatherCondition: '雨',
    roadCondition: '濕潤',
    lightCondition: '日間',
    cause: '未保持安全距離',
  },
  {
    occurDate: '2026/02/10',
    occurTime: '22:15',
    county: '臺北市',
    district: '中正區',
    address: '忠孝東路一段',
    accidentType: 'A1',
    deathCount: 1,
    injuryCount: 0,
    vehicleTypes: '機車',
    weatherCondition: '晴',
    roadCondition: '乾燥',
    lightCondition: '夜間',
    cause: '酒駕',
  },
];

beforeEach(() => {
  mockFetchAccidents.mockReset();
});

// --- Get Recent Accidents ---
describe('getRecentAccidents', () => {
  it('returns recent accident records', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getRecentAccidents(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('近期交通事故');
    expect(result.content[0].text).toContain('忠孝東路一段');
    expect(result.content[0].text).toContain('3 筆');
  });

  it('respects custom limit', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: [sampleRecords[0]], total: 50 });
    const result = await getRecentAccidents(env, { limit: 1 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('1 筆');
  });

  it('handles empty results', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRecentAccidents(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid limit', async () => {
    const result = await getRecentAccidents(env, { limit: 200 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1-100');
  });

  it('handles API error gracefully', async () => {
    mockFetchAccidents.mockRejectedValueOnce(new Error('API down'));
    const result = await getRecentAccidents(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Search By Location ---
describe('searchByLocation', () => {
  it('returns accidents for a county', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await searchByLocation(env, { county: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('3 筆');
  });

  it('filters by district when provided', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await searchByLocation(env, { county: '臺北市', district: '中正區' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中正區');
    // Only 2 records are in 中正區
    expect(result.content[0].text).toContain('2 筆');
  });

  it('handles empty results', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchByLocation(env, { county: '金門縣' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error when county is missing', async () => {
    const result = await searchByLocation(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('縣市名稱');
  });

  it('returns error when county is empty string', async () => {
    const result = await searchByLocation(env, { county: '' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchAccidents.mockRejectedValueOnce(new Error('Network error'));
    const result = await searchByLocation(env, { county: '臺北市' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error');
  });
});

// --- Get Accident Stats ---
describe('getAccidentStats', () => {
  it('returns aggregate statistics', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getAccidentStats(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('事故總數: 3 件');
    expect(result.content[0].text).toContain('死亡人數: 1 人');
    expect(result.content[0].text).toContain('受傷人數: 3 人');
  });

  it('groups by accident type', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getAccidentStats(env, {});
    expect(result.content[0].text).toContain('A2');
    expect(result.content[0].text).toContain('A1');
  });

  it('shows top causes', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getAccidentStats(env, {});
    expect(result.content[0].text).toContain('未注意車前狀況');
    expect(result.content[0].text).toContain('主要肇事原因');
  });

  it('filters by county', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getAccidentStats(env, { county: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('filters by period', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getAccidentStats(env, { period: '2026/01' });
    expect(result.isError).toBeUndefined();
    // Only 2 records are in 2026/01
    expect(result.content[0].text).toContain('事故總數: 2 件');
  });

  it('handles empty results', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getAccidentStats(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid county type', async () => {
    const result = await getAccidentStats(env, { county: '' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchAccidents.mockRejectedValueOnce(new Error('Timeout'));
    const result = await getAccidentStats(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Timeout');
  });
});

// --- Get Dangerous Intersections ---
describe('getDangerousIntersections', () => {
  it('ranks intersections by frequency', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getDangerousIntersections(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('事故熱點路口');
    // 忠孝東路一段 appears twice
    expect(result.content[0].text).toContain('忠孝東路一段');
    expect(result.content[0].text).toContain('2 件事故');
  });

  it('respects custom limit', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getDangerousIntersections(env, { limit: 1 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Top 1');
  });

  it('filters by county', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getDangerousIntersections(env, { county: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty results', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getDangerousIntersections(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid limit', async () => {
    const result = await getDangerousIntersections(env, { limit: 100 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1-50');
  });

  it('returns error for invalid county type', async () => {
    const result = await getDangerousIntersections(env, { county: '' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchAccidents.mockRejectedValueOnce(new Error('Service unavailable'));
    const result = await getDangerousIntersections(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Service unavailable');
  });
});

// --- Get Historical Trends ---
describe('getHistoricalTrends', () => {
  it('groups records by month', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getHistoricalTrends(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('月別趨勢');
    expect(result.content[0].text).toContain('2026-01');
    expect(result.content[0].text).toContain('2026-02');
  });

  it('includes summary statistics', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getHistoricalTrends(env, {});
    expect(result.content[0].text).toContain('摘要');
    expect(result.content[0].text).toContain('事故總數: 3 件');
    expect(result.content[0].text).toContain('月平均事故數');
  });

  it('filters by county', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getHistoricalTrends(env, { county: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty results', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getHistoricalTrends(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid county type', async () => {
    const result = await getHistoricalTrends(env, { county: '' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchAccidents.mockRejectedValueOnce(new Error('Connection refused'));
    const result = await getHistoricalTrends(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Connection refused');
  });

  it('handles dash-separated date format', async () => {
    const dashRecords = [
      { ...sampleRecords[0], occurDate: '2026-03-15' },
      { ...sampleRecords[1], occurDate: '2026-03-20' },
    ];
    mockFetchAccidents.mockResolvedValueOnce({ records: dashRecords, total: 2 });
    const result = await getHistoricalTrends(env, {});
    expect(result.content[0].text).toContain('2026-03');
  });

  it('handles compact date format (YYYYMMDD)', async () => {
    const compactRecords = [
      { ...sampleRecords[0], occurDate: '20260115' },
    ];
    mockFetchAccidents.mockResolvedValueOnce({ records: compactRecords, total: 1 });
    const result = await getHistoricalTrends(env, {});
    expect(result.content[0].text).toContain('2026-01');
  });
});
