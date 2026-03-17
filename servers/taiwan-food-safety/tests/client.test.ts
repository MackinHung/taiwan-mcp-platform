import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchDataset, DATASETS } from '../src/client.js';

describe('DATASETS', () => {
  it('has DRUG_APPROVAL dataset ID', () => {
    expect(DATASETS.DRUG_APPROVAL).toBe('36');
  });

  it('has FOOD_BUSINESS dataset ID', () => {
    expect(DATASETS.FOOD_BUSINESS).toBe('97');
  });

  it('has FOOD_VIOLATION dataset ID', () => {
    expect(DATASETS.FOOD_VIOLATION).toBe('155');
  });

  it('has FOOD_ADDITIVE dataset ID', () => {
    expect(DATASETS.FOOD_ADDITIVE).toBe('70');
  });

  it('has HYGIENE_INSPECTION dataset ID', () => {
    expect(DATASETS.HYGIENE_INSPECTION).toBe('74');
  });
});

describe('buildUrl', () => {
  it('builds URL with default limit', () => {
    const url = buildUrl('155');
    expect(url).toContain('https://data.fda.gov.tw/opendata/exportDataList.do');
    expect(url).toContain('method=openDataApi');
    expect(url).toContain('InfoId=155');
    expect(url).toContain('limit=50');
  });

  it('builds URL with custom limit', () => {
    const url = buildUrl('36', 100);
    expect(url).toContain('InfoId=36');
    expect(url).toContain('limit=100');
  });

  it('returns a valid URL', () => {
    const url = buildUrl('97', 20);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('method')).toBe('openDataApi');
    expect(parsed.searchParams.get('InfoId')).toBe('97');
    expect(parsed.searchParams.get('limit')).toBe('20');
  });
});

describe('fetchDataset', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns parsed array', async () => {
    const mockData = [
      { 產品名稱: '測試產品', 違規廠商名稱: '測試廠商' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await fetchDataset('155', 10);
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('InfoId=155');
    expect(callUrl).toContain('limit=10');
  });

  it('throws on non-200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );
    await expect(fetchDataset('155')).rejects.toThrow('FDA API error: 500');
  });

  it('throws on non-array response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'not an array' }),
      })
    );
    await expect(fetchDataset('155')).rejects.toThrow(
      'FDA API returned unexpected format'
    );
  });

  it('uses default limit of 50', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
    await fetchDataset('36');
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('limit=50');
  });
});
