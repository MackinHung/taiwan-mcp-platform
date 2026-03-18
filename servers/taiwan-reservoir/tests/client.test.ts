import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildWraUrl, buildDataGovUrl, fetchReservoirData } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildWraUrl', () => {
  it('constructs correct WRA URL with default format=json', () => {
    const url = buildWraUrl();
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.wra.gov.tw/Service/OpenData.aspx'
    );
    expect(parsed.searchParams.get('format')).toBe('json');
    expect(parsed.searchParams.get('UnitId')).toBe('A21000000I');
  });

  it('allows custom format', () => {
    const url = buildWraUrl({ format: 'xml' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('format')).toBe('xml');
  });
});

describe('buildDataGovUrl', () => {
  it('constructs correct data.gov.tw URL with format=json', () => {
    const url = buildDataGovUrl();
    const parsed = new URL(url);
    expect(parsed.pathname).toContain('A21000000I-002095-059');
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('appends limit parameter', () => {
    const url = buildDataGovUrl({ limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends offset parameter', () => {
    const url = buildDataGovUrl({ offset: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
  });

  it('handles multiple parameters together', () => {
    const url = buildDataGovUrl({ limit: 30, offset: 5 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('offset')).toBe('5');
  });

  it('omits limit when not provided', () => {
    const url = buildDataGovUrl({});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });
});

describe('fetchReservoirData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses data.gov.tw response and returns normalized records', async () => {
    const mockRecords = [
      {
        ReservoirName: '石門水庫',
        EffectiveCapacity: '20000',
        CurrentCapacity: '15000',
        CurrentCapacityPercent: '75',
        CatchmentAreaRainfall: '5.2',
        WaterInflow: '100',
        WaterOutflow: '80',
        WaterSupply: '60',
        UpdateTime: '2026-03-18 10:00',
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: mockRecords,
          total: 1,
        },
      }),
    });

    const result = await fetchReservoirData();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].ReservoirName).toBe('石門水庫');
    expect(result.records[0].CurrentCapacityPercent).toBe('75');
    expect(result.total).toBe(1);
  });

  it('handles Chinese field names in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [
            {
              '水庫名稱': '曾文水庫',
              '有效容量': '50000',
              '蓄水量': '30000',
              '蓄水百分比': '60',
            },
          ],
          total: 1,
        },
      }),
    });

    const result = await fetchReservoirData();
    expect(result.records[0].ReservoirName).toBe('曾文水庫');
    expect(result.records[0].EffectiveCapacity).toBe('50000');
    expect(result.records[0].CurrentCapacity).toBe('30000');
    expect(result.records[0].CurrentCapacityPercent).toBe('60');
  });

  it('handles array response format (WRA direct)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          ReservoirName: '翡翠水庫',
          CurrentCapacity: '28000',
          CurrentCapacityPercent: '85',
        },
      ],
    });

    const result = await fetchReservoirData();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].ReservoirName).toBe('翡翠水庫');
    expect(result.total).toBe(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchReservoirData()).rejects.toThrow(
      'Reservoir API error: 500 Internal Server Error'
    );
  });

  it('throws on unexpected response format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    await expect(fetchReservoirData()).rejects.toThrow(
      'Reservoir API returned unexpected response format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchReservoirData()).rejects.toThrow('Network error');
  });

  it('passes limit parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchReservoirData({ limit: 50 });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('limit=50');
  });
});
