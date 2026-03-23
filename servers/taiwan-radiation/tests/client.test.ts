import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchRadiationData, RADIATION_RESOURCE_ID } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeOpenDataResponse = (records: Record<string, string>[], total?: number) => ({
  success: true,
  result: {
    resource_id: RADIATION_RESOURCE_ID,
    fields: [],
    records,
    total: total ?? records.length,
    limit: 100,
    offset: 0,
  },
});

describe('buildUrl', () => {
  it('constructs correct URL with data.gov.tw base', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      `https://data.gov.tw/api/v2/rest/datastore/${RADIATION_RESOURCE_ID}`
    );
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('includes limit when provided', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID, { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('includes offset when provided', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID, { offset: 20 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('20');
  });

  it('includes filters as JSON string', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID, { filters: { '所在縣市': '台北市' } });
    const parsed = new URL(url);
    const filters = parsed.searchParams.get('filters');
    expect(filters).toBe('{"所在縣市":"台北市"}');
  });

  it('does not include limit when not provided', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBeNull();
  });

  it('does not include offset when not provided', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBeNull();
  });

  it('does not include filters when not provided', () => {
    const url = buildUrl(RADIATION_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('filters')).toBeNull();
  });
});

describe('fetchRadiationData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses response and returns normalized RadiationRecord[]', async () => {
    const rawRecords = [
      {
        '監測站名稱': '台北站',
        '監測值': '0.057',
        '測量時間': '2026-03-23 10:00',
        '所在縣市': '台北市',
        '所在地區': '中正區',
        '監測站地址': '台北市中正區100號',
        '狀態': '正常',
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse(rawRecords),
    });

    const result = await fetchRadiationData();
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toEqual({
      stationName: '台北站',
      value: 0.057,
      measureTime: '2026-03-23 10:00',
      county: '台北市',
      district: '中正區',
      address: '台北市中正區100號',
      status: '正常',
    });
  });

  it('returns total from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse([], 42),
    });

    const result = await fetchRadiationData();
    expect(result.total).toBe(42);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchRadiationData()).rejects.toThrow(
      'Open Data API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, result: { records: [], total: 0 } }),
    });

    await expect(fetchRadiationData()).rejects.toThrow(
      'Open Data API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchRadiationData()).rejects.toThrow('Network error');
  });

  it('uses default limit of 100', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse([]),
    });

    await fetchRadiationData();
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('100');
  });

  it('passes custom limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse([]),
    });

    await fetchRadiationData({ limit: 50 });
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('adds county filter when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse([]),
    });

    await fetchRadiationData({ county: '台北市' });
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    const filters = parsed.searchParams.get('filters');
    expect(filters).toContain('台北市');
  });

  it('returns empty array for empty records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse([]),
    });

    const result = await fetchRadiationData();
    expect(result.records).toEqual([]);
  });

  it('handles missing fields in raw record with defaults', async () => {
    const rawRecords = [{ '監測站名稱': '測試站' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse(rawRecords),
    });

    const result = await fetchRadiationData();
    expect(result.records[0]).toEqual({
      stationName: '測試站',
      value: 0,
      measureTime: '',
      county: '',
      district: '',
      address: '',
      status: '',
    });
  });

  it('parses numeric value correctly', async () => {
    const rawRecords = [
      { '監測站名稱': '站A', '監測值': '0.123', '狀態': '正常' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse(rawRecords),
    });

    const result = await fetchRadiationData();
    expect(result.records[0].value).toBe(0.123);
  });

  it('handles non-numeric value as 0', async () => {
    const rawRecords = [
      { '監測站名稱': '站B', '監測值': 'N/A', '狀態': '正常' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeOpenDataResponse(rawRecords),
    });

    const result = await fetchRadiationData();
    expect(result.records[0].value).toBe(0);
  });
});

describe('RADIATION_RESOURCE_ID', () => {
  it('is a non-empty string', () => {
    expect(typeof RADIATION_RESOURCE_ID).toBe('string');
    expect(RADIATION_RESOURCE_ID.length).toBeGreaterThan(0);
  });

  it('matches expected resource ID', () => {
    expect(RADIATION_RESOURCE_ID).toBe('a2940c4a-c75c-4e69-8413-f9e00e5e87b2');
  });
});
