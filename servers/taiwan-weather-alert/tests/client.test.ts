import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchDataset, DATASETS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with dataset ID', () => {
    const url = buildUrl('E-A0015-001');
    expect(url).toBe(
      'https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001'
    );
  });

  it('appends query parameters', () => {
    const url = buildUrl('W-C0033-002', { locationName: '臺北市' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('locationName')).toBe('臺北市');
  });

  it('handles multiple parameters', () => {
    const url = buildUrl('E-A0015-001', { limit: '5', format: 'JSON' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('5');
    expect(parsed.searchParams.get('format')).toBe('JSON');
  });

  it('handles empty params', () => {
    const url = buildUrl('E-A0015-001', {});
    expect(url).toBe(
      'https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001'
    );
  });

  it('handles no params argument', () => {
    const url = buildUrl('W-C0034-001');
    expect(url).toContain('W-C0034-001');
    expect(url).not.toContain('?');
  });
});

describe('fetchDataset', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends correct Authorization header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: 'true', result: {}, records: { data: 1 } }),
    });

    await fetchDataset('my-api-key', DATASETS.EARTHQUAKE_FELT);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('my-api-key');
  });

  it('parses JSON response and returns records', async () => {
    const mockRecords = { Earthquake: [{ EarthquakeNo: 1 }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: 'true', result: {}, records: mockRecords }),
    });

    const result = await fetchDataset('key', DATASETS.EARTHQUAKE_FELT);
    expect(result).toEqual(mockRecords);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(fetchDataset('bad-key', DATASETS.EARTHQUAKE_FELT)).rejects.toThrow(
      'CWA API error: 401 Unauthorized'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: 'false', result: {}, records: null }),
    });

    await expect(fetchDataset('key', DATASETS.WEATHER_WARNING)).rejects.toThrow(
      'CWA API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchDataset('key', DATASETS.TYPHOON)).rejects.toThrow(
      'Network error'
    );
  });
});

describe('DATASETS', () => {
  it('contains all 5 dataset IDs', () => {
    expect(Object.keys(DATASETS)).toHaveLength(5);
    expect(DATASETS.EARTHQUAKE_FELT).toBe('E-A0015-001');
    expect(DATASETS.EARTHQUAKE_LOCAL).toBe('E-A0016-001');
    expect(DATASETS.WEATHER_WARNING).toBe('W-C0033-002');
    expect(DATASETS.TYPHOON).toBe('W-C0034-001');
    expect(DATASETS.HEAVY_RAIN).toBe('F-A0078-001');
  });
});
