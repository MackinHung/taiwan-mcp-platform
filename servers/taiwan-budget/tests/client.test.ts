import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchDataset, DATASETS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with resource ID and format=json', () => {
    const url = buildUrl('A41000000G-000001');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.gov.tw/api/v2/rest/datastore/A41000000G-000001'
    );
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('appends limit parameter', () => {
    const url = buildUrl('A41000000G-000001', { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends offset parameter', () => {
    const url = buildUrl('A41000000G-000001', { offset: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
  });

  it('appends filters as JSON string', () => {
    const url = buildUrl('A41000000G-000001', {
      filters: { '機關名稱': '教育部' },
    });
    const parsed = new URL(url);
    const filters = parsed.searchParams.get('filters');
    expect(filters).toBe(JSON.stringify({ '機關名稱': '教育部' }));
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl('A41000000G-000001', {
      limit: 30,
      offset: 5,
      filters: { '年度': '113' },
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('format')).toBe('json');
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('offset')).toBe('5');
    expect(parsed.searchParams.get('filters')).toBe(JSON.stringify({ '年度': '113' }));
  });

  it('omits limit when not provided', () => {
    const url = buildUrl('A41000000G-000001', {});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });

  it('omits filters when not provided', () => {
    const url = buildUrl('A41000000G-000001', { limit: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('filters')).toBe(false);
  });
});

describe('fetchDataset', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses JSON response and returns records + total', async () => {
    const mockRecords = [{ '機關名稱': '教育部', '預算數': '1000' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          resource_id: 'A41000000G-000001',
          fields: [],
          records: mockRecords,
          total: 1,
          limit: 30,
          offset: 0,
        },
      }),
    });

    const result = await fetchDataset(DATASETS.EXPENDITURE);
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchDataset(DATASETS.EXPENDITURE)).rejects.toThrow(
      'Open Data API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        result: { resource_id: '', fields: [], records: [], total: 0, limit: 0, offset: 0 },
      }),
    });

    await expect(fetchDataset(DATASETS.EXPENDITURE)).rejects.toThrow(
      'Open Data API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchDataset(DATASETS.EXPENDITURE)).rejects.toThrow(
      'Network error'
    );
  });
});

describe('DATASETS', () => {
  it('contains all 5 dataset IDs', () => {
    expect(Object.keys(DATASETS)).toHaveLength(5);
    expect(DATASETS.EXPENDITURE).toBe('A41000000G-000001');
    expect(DATASETS.REVENUE).toBe('A41000000G-000002');
    expect(DATASETS.AGENCY_SUMMARY).toBe('A41000000G-000003');
    expect(DATASETS.FINAL_ACCOUNTS).toBe('A41000000G-000004');
    expect(DATASETS.SPECIAL_BUDGET).toBe('A41000000G-000005');
  });
});
