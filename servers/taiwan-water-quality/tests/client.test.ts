import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchWaterQualityData, WATER_QUALITY_RESOURCE_ID, normalizeRecord } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('WATER_QUALITY_RESOURCE_ID', () => {
  it('is a non-empty string', () => {
    expect(typeof WATER_QUALITY_RESOURCE_ID).toBe('string');
    expect(WATER_QUALITY_RESOURCE_ID.length).toBeGreaterThan(0);
  });
});

describe('buildUrl', () => {
  it('constructs correct URL with resource ID', () => {
    const url = buildUrl('test-resource');
    const parsed = new URL(url);
    expect(parsed.pathname).toContain('test-resource');
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('includes limit parameter when provided', () => {
    const url = buildUrl('test-resource', { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('includes offset parameter when provided', () => {
    const url = buildUrl('test-resource', { offset: 100 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('100');
  });

  it('includes filters as JSON string', () => {
    const url = buildUrl('test-resource', { filters: { '縣市': '台北市' } });
    const parsed = new URL(url);
    const filters = JSON.parse(parsed.searchParams.get('filters')!);
    expect(filters['縣市']).toBe('台北市');
  });

  it('omits filters when not provided', () => {
    const url = buildUrl('test-resource');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('filters')).toBeNull();
  });

  it('uses data.gov.tw opendata base URL', () => {
    const url = buildUrl(WATER_QUALITY_RESOURCE_ID);
    expect(url).toContain('data.gov.tw');
    expect(url).toContain(WATER_QUALITY_RESOURCE_ID);
  });
});

describe('normalizeRecord', () => {
  it('maps Chinese field names to English', () => {
    const raw = {
      '河川名稱': '淡水河',
      '測站名稱': '關渡大橋',
      '採樣日期': '2026-03-15',
      '水溫': '22.5',
      'pH值': '7.2',
      '溶氧量': '5.8',
      '生化需氧量': '3.2',
      '氨氮': '0.85',
      '懸浮固體': '28',
      '河川污染指數RPI': '3.5',
      '污染程度': '輕度污染',
      '縣市': '台北市',
    };
    const record = normalizeRecord(raw);
    expect(record.riverName).toBe('淡水河');
    expect(record.stationName).toBe('關渡大橋');
    expect(record.sampleDate).toBe('2026-03-15');
    expect(record.waterTemp).toBe(22.5);
    expect(record.ph).toBe(7.2);
    expect(record.dissolvedOxygen).toBe(5.8);
    expect(record.bod).toBe(3.2);
    expect(record.ammonia).toBe(0.85);
    expect(record.suspendedSolids).toBe(28);
    expect(record.rpiIndex).toBe(3.5);
    expect(record.pollutionLevel).toBe('輕度污染');
    expect(record.county).toBe('台北市');
  });

  it('handles missing fields with defaults', () => {
    const record = normalizeRecord({});
    expect(record.riverName).toBe('');
    expect(record.stationName).toBe('');
    expect(record.waterTemp).toBe(0);
    expect(record.ph).toBe(0);
    expect(record.rpiIndex).toBe(0);
    expect(record.pollutionLevel).toBe('');
  });

  it('handles non-numeric values gracefully', () => {
    const raw = {
      '水溫': 'N/A',
      'pH值': '',
      '溶氧量': 'invalid',
    };
    const record = normalizeRecord(raw);
    expect(record.waterTemp).toBe(0);
    expect(record.ph).toBe(0);
    expect(record.dissolvedOxygen).toBe(0);
  });
});

describe('fetchWaterQualityData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns records and total from API', async () => {
    const mockData = {
      success: true,
      result: {
        resource_id: WATER_QUALITY_RESOURCE_ID,
        fields: [],
        records: [
          { '河川名稱': '淡水河', '測站名稱': '關渡大橋', '採樣日期': '2026-03-15', '水溫': '22.5', 'pH值': '7.2', '溶氧量': '5.8', '生化需氧量': '3.2', '氨氮': '0.85', '懸浮固體': '28', '河川污染指數RPI': '3.5', '污染程度': '輕度污染', '縣市': '台北市' },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchWaterQualityData();
    expect(result.records).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.records[0].riverName).toBe('淡水河');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchWaterQualityData()).rejects.toThrow(
      'Open Data API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    await expect(fetchWaterQualityData()).rejects.toThrow(
      'Open Data API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchWaterQualityData()).rejects.toThrow('Network error');
  });

  it('passes county filter to URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0, limit: 100, offset: 0 },
      }),
    });

    await fetchWaterQualityData({ county: '台北市' });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('filters');
  });

  it('uses default limit of 100', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0, limit: 100, offset: 0 },
      }),
    });

    await fetchWaterQualityData();
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('100');
  });

  it('accepts custom limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0, limit: 50, offset: 0 },
      }),
    });

    await fetchWaterQualityData({ limit: 50 });
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('returns empty array for zero records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0, limit: 100, offset: 0 },
      }),
    });

    const result = await fetchWaterQualityData();
    expect(result.records).toEqual([]);
    expect(result.total).toBe(0);
  });
});
