import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchHolidays, HOLIDAY_RESOURCE_ID } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('buildUrl', () => {
  it('builds URL with resource ID', () => {
    const url = buildUrl('test-resource');
    expect(url).toContain('https://data.gov.tw/api/v2/rest/datastore/test-resource');
    expect(url).toContain('format=json');
  });

  it('includes limit parameter', () => {
    const url = buildUrl('test', { limit: 50 });
    expect(url).toContain('limit=50');
  });

  it('includes offset parameter', () => {
    const url = buildUrl('test', { offset: 10 });
    expect(url).toContain('offset=10');
  });

  it('includes filters as JSON', () => {
    const url = buildUrl('test', { filters: { '西元日期': '2026' } });
    expect(url).toContain('filters=');
    expect(decodeURIComponent(url)).toContain('西元日期');
  });
});

describe('fetchHolidays', () => {
  it('fetches and returns holiday records for a year', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [
            { '西元日期': '2026/1/1', '名稱': '元旦', '是否放假': '是' },
            { '西元日期': '2026/2/14', '名稱': '春節', '是否放假': '是' },
          ],
          total: 2,
        },
      }),
    });

    const result = await fetchHolidays(2026);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]['名稱']).toBe('元旦');
  });

  it('filters records to only the requested year', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [
            { '西元日期': '2026/1/1', '名稱': '元旦' },
            { '西元日期': '2025/12/31', '名稱': '跨年' },
          ],
          total: 2,
        },
      }),
    });

    const result = await fetchHolidays(2026);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]['名稱']).toBe('元旦');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchHolidays(2026)).rejects.toThrow('Open Data API error');
  });

  it('throws on unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    await expect(fetchHolidays(2026)).rejects.toThrow('unsuccessful');
  });

  it('uses correct resource ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchHolidays(2026);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain(HOLIDAY_RESOURCE_ID);
  });
});
