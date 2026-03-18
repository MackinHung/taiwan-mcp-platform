import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchDataset, DATASETS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with CKAN base and resource_id', () => {
    const url = buildUrl('test-resource-id');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.cdc.gov.tw/api/action/datastore_search'
    );
    expect(parsed.searchParams.get('resource_id')).toBe('test-resource-id');
  });

  it('appends limit parameter', () => {
    const url = buildUrl('test-id', { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends offset parameter', () => {
    const url = buildUrl('test-id', { offset: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
  });

  it('appends q (query) parameter', () => {
    const url = buildUrl('test-id', { q: '登革熱' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('登革熱');
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl('test-id', { limit: 30, offset: 5, q: '流感' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('resource_id')).toBe('test-id');
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('offset')).toBe('5');
    expect(parsed.searchParams.get('q')).toBe('流感');
  });

  it('omits limit when not provided', () => {
    const url = buildUrl('test-id', {});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });

  it('omits q when not provided', () => {
    const url = buildUrl('test-id', { limit: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('q')).toBe(false);
  });
});

describe('fetchDataset', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses CKAN JSON response and returns records + total', async () => {
    const mockRecords = [{ '疾病名稱': '登革熱', '確定病例數': '100' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: mockRecords,
          total: 1,
          fields: [],
        },
      }),
    });

    const result = await fetchDataset(DATASETS.NOTIFIABLE_DISEASES);
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchDataset(DATASETS.NOTIFIABLE_DISEASES)).rejects.toThrow(
      'CDC API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        result: { records: [], total: 0, fields: [] },
      }),
    });

    await expect(fetchDataset(DATASETS.NOTIFIABLE_DISEASES)).rejects.toThrow(
      'CDC API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchDataset(DATASETS.NOTIFIABLE_DISEASES)).rejects.toThrow(
      'Network error'
    );
  });

  it('passes query parameter to URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0, fields: [] },
      }),
    });

    await fetchDataset(DATASETS.NOTIFIABLE_DISEASES, { q: '登革熱' });
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('q')).toBe('登革熱');
  });
});

describe('DATASETS', () => {
  it('contains all 5 dataset resource IDs', () => {
    expect(Object.keys(DATASETS)).toHaveLength(5);
    expect(DATASETS.NOTIFIABLE_DISEASES).toBeDefined();
    expect(DATASETS.VACCINATION).toBeDefined();
    expect(DATASETS.OUTBREAK_ALERTS).toBeDefined();
    expect(DATASETS.EPIDEMIC_TRENDS).toBeDefined();
    expect(DATASETS.DISEASE_INFO).toBeDefined();
  });

  it('resource IDs are non-empty strings', () => {
    for (const value of Object.values(DATASETS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
