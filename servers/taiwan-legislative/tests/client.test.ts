import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchLyApi, ENDPOINTS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with endpoint', () => {
    const url = buildUrl('/bills');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://v2.ly.govapi.tw/bills'
    );
  });

  it('appends limit parameter', () => {
    const url = buildUrl('/bills', { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends offset parameter', () => {
    const url = buildUrl('/bills', { offset: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
  });

  it('appends query parameter as q', () => {
    const url = buildUrl('/bills', { query: '教育' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('教育');
  });

  it('appends id to path', () => {
    const url = buildUrl('/bills', { id: 'BILL-001' });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/bills/BILL-001');
  });

  it('appends filters as individual query params', () => {
    const url = buildUrl('/legislators/votes', {
      filters: { legislator: '王委員', term: 11 },
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('legislator')).toBe('王委員');
    expect(parsed.searchParams.get('term')).toBe('11');
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl('/meetings', {
      limit: 30,
      offset: 5,
      query: '預算',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('offset')).toBe('5');
    expect(parsed.searchParams.get('q')).toBe('預算');
  });

  it('omits limit when not provided', () => {
    const url = buildUrl('/bills', {});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });

  it('omits query when not provided', () => {
    const url = buildUrl('/bills', { limit: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('q')).toBe(false);
  });
});

describe('fetchLyApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses paginated JSON response and returns records + total', async () => {
    const mockRecords = [{ billNo: 'B001', billName: '教育法' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        total: 1,
        limit: 20,
        offset: 0,
        records: mockRecords,
      }),
    });

    const result = await fetchLyApi(ENDPOINTS.BILLS);
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(1);
  });

  it('handles array response format', async () => {
    const mockRecords = [{ billNo: 'B001' }, { billNo: 'B002' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords,
    });

    const result = await fetchLyApi(ENDPOINTS.BILLS);
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(2);
  });

  it('handles single record response for detail endpoints', async () => {
    const mockRecord = { billNo: 'B001', billName: '教育法' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecord,
    });

    const result = await fetchLyApi(ENDPOINTS.BILLS, { id: 'B001' });
    expect(result.records).toEqual([mockRecord]);
    expect(result.total).toBe(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchLyApi(ENDPOINTS.BILLS)).rejects.toThrow(
      'LY API error: 500 Internal Server Error'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchLyApi(ENDPOINTS.BILLS)).rejects.toThrow(
      'Network error'
    );
  });

  it('sends Authorization header when apiKey is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 0, limit: 20, offset: 0, records: [] }),
    });

    await fetchLyApi(ENDPOINTS.BILLS, { apiKey: 'test-key' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('does not send Authorization header when apiKey is absent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 0, limit: 20, offset: 0, records: [] }),
    });

    await fetchLyApi(ENDPOINTS.BILLS);
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders).not.toHaveProperty('Authorization');
  });
});

describe('ENDPOINTS', () => {
  it('contains all 4 endpoint paths', () => {
    expect(Object.keys(ENDPOINTS)).toHaveLength(4);
    expect(ENDPOINTS.BILLS).toBe('/bills');
    expect(ENDPOINTS.LEGISLATORS).toBe('/legislators');
    expect(ENDPOINTS.MEETINGS).toBe('/meetings');
    expect(ENDPOINTS.INTERPELLATIONS).toBe('/interpellations');
  });
});
