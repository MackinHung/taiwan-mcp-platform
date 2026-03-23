import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  WATER_QUALITY_RESOURCE_ID: '36a68e7f-58d5-4f12-8a4e-311b4b0f481c',
  buildUrl: vi.fn(),
  normalizeRecord: vi.fn(),
  fetchWaterQualityData: vi.fn(),
}));

import { fetchWaterQualityData } from '../src/client.js';
import { getRiverQuality } from '../src/tools/river-quality.js';
import { getStationData } from '../src/tools/station-data.js';
import { getPollutionRanking } from '../src/tools/pollution-ranking.js';
import { searchByParameter } from '../src/tools/search-by-parameter.js';
import { getWaterQualityTrends } from '../src/tools/water-quality-trends.js';
import type { Env } from '../src/types.js';

const mockFetchData = vi.mocked(fetchWaterQualityData);

const env: Env = {
  SERVER_NAME: 'taiwan-water-quality',
  SERVER_VERSION: '1.0.0',
};

const sampleRecords = [
  {
    riverName: '\u6de1\u6c34\u6cb3',
    stationName: '\u95dc\u6e21\u5927\u6a4b',
    sampleDate: '2026-03-15',
    waterTemp: 22.5,
    ph: 7.2,
    dissolvedOxygen: 5.8,
    bod: 3.2,
    ammonia: 0.85,
    suspendedSolids: 28,
    rpiIndex: 3.5,
    pollutionLevel: '\u8f15\u5ea6\u6c61\u67d3',
    county: '\u53f0\u5317\u5e02',
  },
  {
    riverName: '\u5927\u7532\u6eaa',
    stationName: '\u77f3\u5ca1\u58e9',
    sampleDate: '2026-03-15',
    waterTemp: 18.3,
    ph: 7.8,
    dissolvedOxygen: 8.2,
    bod: 1.1,
    ammonia: 0.12,
    suspendedSolids: 8,
    rpiIndex: 1.0,
    pollutionLevel: '\u672a(\u7a0d)\u53d7\u6c61\u67d3',
    county: '\u53f0\u4e2d\u5e02',
  },
  {
    riverName: '\u4e8c\u4ec1\u6eaa',
    stationName: '\u4e8c\u4ec1\u6eaa\u6a4b',
    sampleDate: '2026-03-15',
    waterTemp: 25.1,
    ph: 6.9,
    dissolvedOxygen: 2.1,
    bod: 8.5,
    ammonia: 5.2,
    suspendedSolids: 85,
    rpiIndex: 8.75,
    pollutionLevel: '\u56b4\u91cd\u6c61\u67d3',
    county: '\u9ad8\u96c4\u5e02',
  },
];

beforeEach(() => {
  mockFetchData.mockReset();
});

// --- get_river_quality ---
describe('getRiverQuality', () => {
  it('returns river quality data', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getRiverQuality(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u95dc\u6e21\u5927\u6a4b');
    expect(result.content[0].text).toContain('\u6de1\u6c34\u6cb3');
  });

  it('filters by county', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getRiverQuality(env, { county: '\u53f0\u5317\u5e02' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u53f0\u5317\u5e02');
  });

  it('returns no-data message when empty', async () => {
    mockFetchData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRiverQuality(env, {});
    expect(result.content[0].text).toContain('\u7121\u6cb3\u5ddd\u6c34\u8cea\u8cc7\u6599');
  });

  it('respects limit parameter', async () => {
    const manyRecords = Array.from({ length: 30 }, (_, i) => ({
      ...sampleRecords[0],
      stationName: `\u6e2c\u7ad9${i}`,
    }));
    mockFetchData.mockResolvedValueOnce({ records: manyRecords, total: 30 });
    const result = await getRiverQuality(env, { limit: 5 });
    expect(result.content[0].text).toContain('\u986f\u793a 5 \u7b46');
  });

  it('handles API error gracefully', async () => {
    mockFetchData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await getRiverQuality(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('shows RPI and pollution level', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getRiverQuality(env, {});
    expect(result.content[0].text).toContain('RPI');
    expect(result.content[0].text).toContain('\u6c61\u67d3\u7a0b\u5ea6');
  });
});

// --- get_station_data ---
describe('getStationData', () => {
  it('returns station data for valid name', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getStationData(env, { stationName: '\u95dc\u6e21\u5927\u6a4b' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u95dc\u6e21\u5927\u6a4b');
    expect(result.content[0].text).toContain('\u6de1\u6c34\u6cb3');
  });

  it('returns error when stationName is empty', async () => {
    const result = await getStationData(env, { stationName: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('\u8acb\u63d0\u4f9b\u6e2c\u7ad9\u540d\u7a31');
  });

  it('returns error when stationName is missing', async () => {
    const result = await getStationData(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('\u8acb\u63d0\u4f9b\u6e2c\u7ad9\u540d\u7a31');
  });

  it('returns no-results when station not found', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getStationData(env, { stationName: '\u4e0d\u5b58\u5728\u7684\u6e2c\u7ad9' });
    expect(result.content[0].text).toContain('\u67e5\u7121\u6e2c\u7ad9');
  });

  it('shows water quality parameters', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getStationData(env, { stationName: '\u95dc\u6e21\u5927\u6a4b' });
    expect(result.content[0].text).toContain('pH');
    expect(result.content[0].text).toContain('\u6eb6\u6c27\u91cf');
    expect(result.content[0].text).toContain('BOD');
  });

  it('handles API error gracefully', async () => {
    mockFetchData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getStationData(env, { stationName: '\u95dc\u6e21\u5927\u6a4b' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('matches partial station name', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getStationData(env, { stationName: '\u95dc\u6e21' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u95dc\u6e21\u5927\u6a4b');
  });
});

// --- get_pollution_ranking ---
describe('getPollutionRanking', () => {
  it('returns stations sorted by RPI descending', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getPollutionRanking(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    const pos1 = text.indexOf('\u4e8c\u4ec1\u6eaa\u6a4b');
    const pos2 = text.indexOf('\u95dc\u6e21\u5927\u6a4b');
    const pos3 = text.indexOf('\u77f3\u5ca1\u58e9');
    expect(pos1).toBeLessThan(pos2);
    expect(pos2).toBeLessThan(pos3);
  });

  it('returns no-data message when empty', async () => {
    mockFetchData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getPollutionRanking(env, {});
    expect(result.content[0].text).toContain('\u7121\u6cb3\u5ddd\u6c34\u8cea\u8cc7\u6599');
  });

  it('respects limit parameter', async () => {
    const manyRecords = Array.from({ length: 30 }, (_, i) => ({
      ...sampleRecords[0],
      stationName: `\u6e2c\u7ad9${i}`,
      rpiIndex: 30 - i,
    }));
    mockFetchData.mockResolvedValueOnce({ records: manyRecords, total: 30 });
    const result = await getPollutionRanking(env, { limit: 5 });
    expect(result.content[0].text).toContain('\u986f\u793a 5 \u7b46');
  });

  it('shows ranking numbers', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getPollutionRanking(env, {});
    expect(result.content[0].text).toContain('#1');
    expect(result.content[0].text).toContain('#2');
  });

  it('handles API error gracefully', async () => {
    mockFetchData.mockRejectedValueOnce(new Error('server down'));
    const result = await getPollutionRanking(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });
});

// --- search_by_parameter ---
describe('searchByParameter', () => {
  it('filters by maxValue', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await searchByParameter(env, { parameter: '\u6eb6\u6c27\u91cf', maxValue: 6 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u95dc\u6e21\u5927\u6a4b');
    expect(result.content[0].text).toContain('\u4e8c\u4ec1\u6eaa\u6a4b');
  });

  it('filters by minValue', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await searchByParameter(env, { parameter: '\u6eb6\u6c27\u91cf', minValue: 7 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u77f3\u5ca1\u58e9');
  });

  it('filters by both min and max', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await searchByParameter(env, { parameter: 'pH', minValue: 7, maxValue: 7.5 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u95dc\u6e21\u5927\u6a4b');
  });

  it('returns error for invalid parameter', async () => {
    const result = await searchByParameter(env, { parameter: '\u4e0d\u5b58\u5728\u53c3\u6578', maxValue: 5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('\u8acb\u63d0\u4f9b\u6709\u6548\u7684\u6c34\u8cea\u53c3\u6578');
  });

  it('returns error when parameter is missing', async () => {
    const result = await searchByParameter(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error when no min/max provided', async () => {
    const result = await searchByParameter(env, { parameter: 'pH' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('maxValue');
  });

  it('returns no-results when nothing matches', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await searchByParameter(env, { parameter: '\u6eb6\u6c27\u91cf', minValue: 100 });
    expect(result.content[0].text).toContain('\u67e5\u7121');
  });

  it('respects limit parameter', async () => {
    const manyRecords = Array.from({ length: 30 }, (_, i) => ({
      ...sampleRecords[0],
      stationName: `\u6e2c\u7ad9${i}`,
    }));
    mockFetchData.mockResolvedValueOnce({ records: manyRecords, total: 30 });
    const result = await searchByParameter(env, { parameter: 'pH', maxValue: 8, limit: 5 });
    expect(result.content[0].text).toContain('\u986f\u793a 5 \u7b46');
  });

  it('handles API error gracefully', async () => {
    mockFetchData.mockRejectedValueOnce(new Error('rate limited'));
    const result = await searchByParameter(env, { parameter: 'pH', maxValue: 8 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });
});

// --- get_water_quality_trends ---
describe('getWaterQualityTrends', () => {
  const trendRecords = [
    { ...sampleRecords[0], sampleDate: '2026-01-15', rpiIndex: 2.0 },
    { ...sampleRecords[0], sampleDate: '2026-02-15', rpiIndex: 3.0 },
    { ...sampleRecords[0], sampleDate: '2026-03-15', rpiIndex: 4.0 },
  ];

  it('returns trend data for river', async () => {
    mockFetchData.mockResolvedValueOnce({ records: trendRecords, total: 3 });
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u6de1\u6c34\u6cb3');
    expect(result.content[0].text).toContain('\u8da8\u52e2');
  });

  it('returns trend data for station', async () => {
    mockFetchData.mockResolvedValueOnce({ records: trendRecords, total: 3 });
    const result = await getWaterQualityTrends(env, { stationName: '\u95dc\u6e21\u5927\u6a4b' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u95dc\u6e21\u5927\u6a4b');
  });

  it('returns error when both riverName and stationName are missing', async () => {
    const result = await getWaterQualityTrends(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('riverName');
  });

  it('returns no-results when nothing matches', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 3 });
    const result = await getWaterQualityTrends(env, { riverName: '\u4e0d\u5b58\u5728\u6cb3\u5ddd' });
    expect(result.content[0].text).toContain('\u67e5\u7121');
  });

  it('shows RPI change and trend direction', async () => {
    mockFetchData.mockResolvedValueOnce({ records: trendRecords, total: 3 });
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    expect(result.content[0].text).toContain('RPI \u8b8a\u5316');
  });

  it('detects worsening trend', async () => {
    const worseningRecords = [
      { ...sampleRecords[0], sampleDate: '2026-01-15', rpiIndex: 2.0 },
      { ...sampleRecords[0], sampleDate: '2026-03-15', rpiIndex: 5.0 },
    ];
    mockFetchData.mockResolvedValueOnce({ records: worseningRecords, total: 2 });
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    expect(result.content[0].text).toContain('\u60e1\u5316');
  });

  it('detects improving trend', async () => {
    const improvingRecords = [
      { ...sampleRecords[0], sampleDate: '2026-01-15', rpiIndex: 5.0 },
      { ...sampleRecords[0], sampleDate: '2026-03-15', rpiIndex: 2.0 },
    ];
    mockFetchData.mockResolvedValueOnce({ records: improvingRecords, total: 2 });
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    expect(result.content[0].text).toContain('\u6539\u5584');
  });

  it('detects stable trend', async () => {
    const stableRecords = [
      { ...sampleRecords[0], sampleDate: '2026-01-15', rpiIndex: 3.0 },
      { ...sampleRecords[0], sampleDate: '2026-03-15', rpiIndex: 3.2 },
    ];
    mockFetchData.mockResolvedValueOnce({ records: stableRecords, total: 2 });
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    expect(result.content[0].text).toContain('\u6301\u5e73');
  });

  it('handles API error gracefully', async () => {
    mockFetchData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });

  it('sorts records by date', async () => {
    const unsortedRecords = [
      { ...sampleRecords[0], sampleDate: '2026-03-15', rpiIndex: 4.0 },
      { ...sampleRecords[0], sampleDate: '2026-01-15', rpiIndex: 2.0 },
      { ...sampleRecords[0], sampleDate: '2026-02-15', rpiIndex: 3.0 },
    ];
    mockFetchData.mockResolvedValueOnce({ records: unsortedRecords, total: 3 });
    const result = await getWaterQualityTrends(env, { riverName: '\u6de1\u6c34\u6cb3' });
    const text = result.content[0].text;
    const pos1 = text.indexOf('2026-01-15');
    const pos2 = text.indexOf('2026-02-15');
    const pos3 = text.indexOf('2026-03-15');
    expect(pos1).toBeLessThan(pos2);
    expect(pos2).toBeLessThan(pos3);
  });
});
