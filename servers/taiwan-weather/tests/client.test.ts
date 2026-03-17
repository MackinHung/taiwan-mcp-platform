import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchDataset, DATASETS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with dataset ID', () => {
    const url = buildUrl('F-C0032-001');
    expect(url).toBe(
      'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001'
    );
  });

  it('appends query parameters', () => {
    const url = buildUrl('F-C0032-001', { locationName: '臺北市' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('locationName')).toBe('臺北市');
  });

  it('handles multiple parameters', () => {
    const url = buildUrl('F-C0032-001', { locationName: '臺北市', limit: '5' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('locationName')).toBe('臺北市');
    expect(parsed.searchParams.get('limit')).toBe('5');
  });

  it('handles empty params', () => {
    const url = buildUrl('F-C0032-001', {});
    expect(url).toBe(
      'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001'
    );
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

    await fetchDataset('my-api-key', DATASETS.FORECAST_36HR);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('my-api-key');
  });

  it('parses JSON response and returns records', async () => {
    const mockRecords = { location: [{ locationName: '臺北市' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: 'true', result: {}, records: mockRecords }),
    });

    const result = await fetchDataset('key', DATASETS.FORECAST_36HR);
    expect(result).toEqual(mockRecords);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(fetchDataset('bad-key', DATASETS.FORECAST_36HR)).rejects.toThrow(
      'CWA API error: 401 Unauthorized'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: 'false', result: {}, records: null }),
    });

    await expect(fetchDataset('key', DATASETS.FORECAST_36HR)).rejects.toThrow(
      'CWA API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchDataset('key', DATASETS.FORECAST_36HR)).rejects.toThrow(
      'Network error'
    );
  });
});

describe('DATASETS', () => {
  it('contains all 8 dataset IDs', () => {
    expect(Object.keys(DATASETS)).toHaveLength(8);
    expect(DATASETS.FORECAST_36HR).toBe('F-C0032-001');
    expect(DATASETS.FORECAST_7DAY).toBe('F-D0047-091');
    expect(DATASETS.EARTHQUAKE).toBe('E-A0015-001');
    expect(DATASETS.TYPHOON).toBe('W-C0034-001');
    expect(DATASETS.WARNING).toBe('W-C0033-002');
    expect(DATASETS.RAIN).toBe('O-A0002-001');
    expect(DATASETS.TIDAL).toBe('F-A0021-001');
    expect(DATASETS.UV).toBe('E-A0014-001');
  });
});
