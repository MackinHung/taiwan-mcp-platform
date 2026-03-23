import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchFireData, FIRE_RESOURCE_ID, normalizeRecord } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeApiResponse = (records: Record<string, string>[], total?: number) => ({
  success: true,
  result: {
    resource_id: FIRE_RESOURCE_ID,
    fields: [],
    records,
    total: total ?? records.length,
    limit: 100,
    offset: 0,
  },
});

describe('buildUrl', () => {
  it('constructs correct URL with data.gov.tw base', () => {
    const url = buildUrl(FIRE_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      `https://data.gov.tw/api/v2/rest/datastore/${FIRE_RESOURCE_ID}`
    );
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('includes limit parameter', () => {
    const url = buildUrl(FIRE_RESOURCE_ID, { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('includes offset parameter', () => {
    const url = buildUrl(FIRE_RESOURCE_ID, { offset: 100 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('100');
  });

  it('includes filters as JSON string', () => {
    const url = buildUrl(FIRE_RESOURCE_ID, {
      filters: { '\u767C\u751F\u7E23\u5E02': '\u53F0\u5317\u5E02' },
    });
    const parsed = new URL(url);
    const filters = parsed.searchParams.get('filters');
    expect(filters).toBeTruthy();
    const parsed2 = JSON.parse(filters!);
    expect(parsed2['\u767C\u751F\u7E23\u5E02']).toBe('\u53F0\u5317\u5E02');
  });

  it('omits limit when not provided', () => {
    const url = buildUrl(FIRE_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });

  it('omits offset when not provided', () => {
    const url = buildUrl(FIRE_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.has('offset')).toBe(false);
  });

  it('omits filters when not provided', () => {
    const url = buildUrl(FIRE_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.has('filters')).toBe(false);
  });
});

describe('normalizeRecord', () => {
  it('maps Chinese field names to English properties', () => {
    const raw = {
      '\u767C\u751F\u65E5\u671F': '2026-03-15',
      '\u767C\u751F\u6642\u9593': '14:30',
      '\u767C\u751F\u7E23\u5E02': '\u53F0\u5317\u5E02',
      '\u767C\u751F\u5730\u5340': '\u5927\u5B89\u5340',
      '\u706B\u707D\u985E\u578B': '\u5EFA\u7BC9\u7269\u706B\u707D',
      '\u8D77\u706B\u539F\u56E0': '\u96FB\u6C23\u56E0\u7D20',
      '\u6B7B\u4EA1\u4EBA\u6578': '0',
      '\u53D7\u50B7\u4EBA\u6578': '2',
      '\u71D2\u640D\u9762\u7A4D': '50',
      '\u8CA1\u7269\u640D\u5931\u4F30\u503C': '500000',
    };
    const result = normalizeRecord(raw);
    expect(result.occurDate).toBe('2026-03-15');
    expect(result.occurTime).toBe('14:30');
    expect(result.county).toBe('\u53F0\u5317\u5E02');
    expect(result.district).toBe('\u5927\u5B89\u5340');
    expect(result.fireType).toBe('\u5EFA\u7BC9\u7269\u706B\u707D');
    expect(result.cause).toBe('\u96FB\u6C23\u56E0\u7D20');
    expect(result.deathCount).toBe(0);
    expect(result.injuryCount).toBe(2);
    expect(result.burnArea).toBe(50);
    expect(result.propertyLoss).toBe(500000);
  });

  it('defaults missing fields to empty string or 0', () => {
    const result = normalizeRecord({});
    expect(result.occurDate).toBe('');
    expect(result.county).toBe('');
    expect(result.deathCount).toBe(0);
    expect(result.propertyLoss).toBe(0);
  });

  it('parses non-numeric number fields as 0', () => {
    const raw = {
      '\u6B7B\u4EA1\u4EBA\u6578': 'abc',
      '\u53D7\u50B7\u4EBA\u6578': '',
    };
    const result = normalizeRecord(raw);
    expect(result.deathCount).toBe(0);
    expect(result.injuryCount).toBe(0);
  });
});

describe('fetchFireData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses OpenData response and returns normalized records', async () => {
    const mockData = makeApiResponse([
      {
        '\u767C\u751F\u65E5\u671F': '2026-03-15',
        '\u767C\u751F\u7E23\u5E02': '\u53F0\u5317\u5E02',
        '\u6B7B\u4EA1\u4EBA\u6578': '1',
      },
    ], 1);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchFireData();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].county).toBe('\u53F0\u5317\u5E02');
    expect(result.records[0].deathCount).toBe(1);
    expect(result.total).toBe(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchFireData()).rejects.toThrow(
      'Open Data API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, result: { records: [], total: 0, limit: 100, offset: 0 } }),
    });

    await expect(fetchFireData()).rejects.toThrow(
      'Open Data API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchFireData()).rejects.toThrow('Network error');
  });

  it('passes county filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse([], 0),
    });

    await fetchFireData({ county: '\u53F0\u5317\u5E02' });
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.has('filters')).toBe(true);
    const filters = JSON.parse(parsed.searchParams.get('filters')!);
    expect(filters['\u767C\u751F\u7E23\u5E02']).toBe('\u53F0\u5317\u5E02');
  });

  it('uses default limit of 100', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse([], 0),
    });

    await fetchFireData();
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('100');
  });

  it('passes custom limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse([], 0),
    });

    await fetchFireData({ limit: 50 });
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('returns empty records for empty API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse([], 0),
    });

    const result = await fetchFireData();
    expect(result.records).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe('FIRE_RESOURCE_ID', () => {
  it('is a non-empty string', () => {
    expect(typeof FIRE_RESOURCE_ID).toBe('string');
    expect(FIRE_RESOURCE_ID.length).toBeGreaterThan(0);
  });
});
