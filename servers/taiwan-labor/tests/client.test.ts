import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchOpenData, RESOURCE_IDS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with resource ID', () => {
    const url = buildUrl('6415');
    expect(url).toBe('https://data.gov.tw/api/v2/rest/datastore/6415');
  });

  it('appends query parameters', () => {
    const url = buildUrl('6415', { limit: '20' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('20');
  });

  it('handles multiple parameters', () => {
    const url = buildUrl('6415', {
      limit: '10',
      'filters[industry]': '製造業',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('10');
    expect(parsed.searchParams.get('filters[industry]')).toBe('製造業');
  });

  it('handles empty params', () => {
    const url = buildUrl('6415', {});
    expect(url).toBe('https://data.gov.tw/api/v2/rest/datastore/6415');
  });
});

describe('fetchOpenData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches and returns records array', async () => {
    const mockRecords = [
      { year: '2024', industry: '製造業', averageWage: '45000' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { resource_id: '6415', fields: [], records: mockRecords, total: 1 },
      }),
    });

    const result = await fetchOpenData('6415');
    expect(result).toEqual(mockRecords);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchOpenData('6415')).rejects.toThrow(
      'data.gov.tw API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        result: { resource_id: '6415', fields: [], records: [], total: 0 },
      }),
    });

    await expect(fetchOpenData('6415')).rejects.toThrow(
      'data.gov.tw API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchOpenData('6415')).rejects.toThrow('Network error');
  });
});

describe('RESOURCE_IDS', () => {
  it('contains wage statistics resource ID', () => {
    expect(RESOURCE_IDS.WAGE_STATISTICS).toBe('6415');
  });

  it('has expected number of resource IDs', () => {
    expect(Object.keys(RESOURCE_IDS)).toHaveLength(1);
  });
});
