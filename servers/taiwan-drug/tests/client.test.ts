import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchDrugData, DATASETS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with FDA base and openDataApi method', () => {
    const url = buildUrl('36');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.fda.gov.tw/opendata/exportDataList.do'
    );
    expect(parsed.searchParams.get('method')).toBe('openDataApi');
    expect(parsed.searchParams.get('InfoId')).toBe('36');
  });

  it('includes default limit of 50', () => {
    const url = buildUrl('36');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('accepts custom limit', () => {
    const url = buildUrl('36', 100);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('100');
  });

  it('uses correct InfoId for DRUG_APPROVAL dataset', () => {
    const url = buildUrl(DATASETS.DRUG_APPROVAL);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('InfoId')).toBe('36');
  });
});

describe('fetchDrugData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses JSON array response and returns DrugRecord[]', async () => {
    const mockData = [
      { '許可證字號': 'DHA00001', '中文品名': '測試藥品' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchDrugData();
    expect(result).toEqual(mockData);
    expect(result).toHaveLength(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchDrugData()).rejects.toThrow(
      'FDA API error: 500 Internal Server Error'
    );
  });

  it('throws on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'bad request' }),
    });

    await expect(fetchDrugData()).rejects.toThrow(
      'FDA API returned unexpected format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchDrugData()).rejects.toThrow('Network error');
  });

  it('passes custom limit to the URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchDrugData(200);
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('200');
  });

  it('returns empty array for empty API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await fetchDrugData();
    expect(result).toEqual([]);
  });
});

describe('DATASETS', () => {
  it('contains DRUG_APPROVAL with InfoId 36', () => {
    expect(DATASETS.DRUG_APPROVAL).toBe('36');
  });

  it('has at least 1 dataset', () => {
    expect(Object.keys(DATASETS).length).toBeGreaterThanOrEqual(1);
  });
});
