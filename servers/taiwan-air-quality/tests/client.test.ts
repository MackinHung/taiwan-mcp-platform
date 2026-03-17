import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchAqiData, DATASETS } from '../src/client.js';

describe('DATASETS', () => {
  it('has AQI_CURRENT dataset ID', () => {
    expect(DATASETS.AQI_CURRENT).toBe('aqx_p_432');
  });
});

describe('buildUrl', () => {
  it('builds URL with api_key and format', () => {
    const url = buildUrl('aqx_p_432', 'test-key');
    expect(url).toContain('https://data.moenv.gov.tw/api/v2/aqx_p_432');
    expect(url).toContain('api_key=test-key');
    expect(url).toContain('format=json');
  });

  it('appends extra params', () => {
    const url = buildUrl('aqx_p_432', 'test-key', { limit: '100', offset: '0' });
    expect(url).toContain('limit=100');
    expect(url).toContain('offset=0');
  });

  it('works with no extra params', () => {
    const url = buildUrl('aqx_p_432', 'test-key');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('api_key')).toBe('test-key');
    expect(parsed.searchParams.get('format')).toBe('json');
  });
});

describe('fetchAqiData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns records', async () => {
    const mockRecords = [
      { sitename: '松山', county: '臺北市', aqi: '50' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ records: mockRecords }),
      })
    );

    const result = await fetchAqiData('test-key');
    expect(result).toEqual(mockRecords);
    expect(fetch).toHaveBeenCalledTimes(1);
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('aqx_p_432');
    expect(callUrl).toContain('api_key=test-key');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );
    await expect(fetchAqiData('test-key')).rejects.toThrow('MOENV API error: 500');
  });

  it('returns empty array when records is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ records: null }),
      })
    );
    const result = await fetchAqiData('test-key');
    expect(result).toEqual([]);
  });

  it('passes extra params to URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ records: [] }),
      })
    );
    await fetchAqiData('test-key', { offset: '50' });
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('offset=50');
  });
});
