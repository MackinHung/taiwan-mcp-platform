import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchFoodNutritionData, DATASETS } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with FDA base and openDataApi method', () => {
    const url = buildUrl('20');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.fda.gov.tw/opendata/exportDataList.do'
    );
    expect(parsed.searchParams.get('method')).toBe('openDataApi');
    expect(parsed.searchParams.get('InfoId')).toBe('20');
  });

  it('includes default limit of 50', () => {
    const url = buildUrl('20');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('accepts custom limit', () => {
    const url = buildUrl('20', 100);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('100');
  });

  it('uses correct InfoId for FOOD_NUTRITION dataset', () => {
    const url = buildUrl(DATASETS.FOOD_NUTRITION);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('InfoId')).toBe('20');
  });
});

describe('fetchFoodNutritionData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses JSON array response and returns FoodNutritionRecord[]', async () => {
    const mockData = [
      { '樣品名稱': '白米飯', '食品分類': '穀物類' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchFoodNutritionData();
    expect(result).toEqual(mockData);
    expect(result).toHaveLength(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchFoodNutritionData()).rejects.toThrow(
      'FDA API error: 500 Internal Server Error'
    );
  });

  it('throws on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'bad request' }),
    });

    await expect(fetchFoodNutritionData()).rejects.toThrow(
      'FDA API returned unexpected format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchFoodNutritionData()).rejects.toThrow('Network error');
  });

  it('passes custom limit to the URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchFoodNutritionData(200);
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('limit')).toBe('200');
  });

  it('returns empty array for empty API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await fetchFoodNutritionData();
    expect(result).toEqual([]);
  });
});

describe('DATASETS', () => {
  it('contains FOOD_NUTRITION with InfoId 20', () => {
    expect(DATASETS.FOOD_NUTRITION).toBe('20');
  });

  it('has at least 1 dataset', () => {
    expect(Object.keys(DATASETS).length).toBeGreaterThanOrEqual(1);
  });
});
