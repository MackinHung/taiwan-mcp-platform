import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchProducts, isVegetable, isFruit } from '../src/client.js';
import type { Env, AgriProduct } from '../src/types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env: Env = {
  SERVER_NAME: 'taiwan-agri-price',
  SERVER_VERSION: '1.0.0',
};

describe('buildUrl', () => {
  it('constructs correct URL with default format=json', () => {
    const url = buildUrl();
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx'
    );
    expect(parsed.searchParams.get('$format')).toBe('json');
  });

  it('appends $top parameter', () => {
    const url = buildUrl({ top: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$top')).toBe('50');
  });

  it('appends $filter parameter', () => {
    const url = buildUrl({ filter: "作物名稱 like '高麗菜'" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$filter')).toBe("作物名稱 like '高麗菜'");
  });

  it('appends api_key parameter', () => {
    const url = buildUrl({ apiKey: 'test-key-123' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('api_key')).toBe('test-key-123');
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl({ top: 100, filter: "市場名稱 like '台北'", apiKey: 'key' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$format')).toBe('json');
    expect(parsed.searchParams.get('$top')).toBe('100');
    expect(parsed.searchParams.get('$filter')).toBe("市場名稱 like '台北'");
    expect(parsed.searchParams.get('api_key')).toBe('key');
  });

  it('omits $top when not provided', () => {
    const url = buildUrl({});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('$top')).toBe(false);
  });

  it('omits $filter when not provided', () => {
    const url = buildUrl({ top: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('$filter')).toBe(false);
  });
});

describe('fetchProducts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses JSON response and returns products array', async () => {
    const mockProducts = [
      { '作物名稱': '高麗菜', '市場名稱': '台北一', '平均價': '25.5' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    const result = await fetchProducts(env);
    expect(result).toEqual(mockProducts);
    expect(result).toHaveLength(1);
  });

  it('passes api_key from env when available', async () => {
    const envWithKey: Env = { ...env, MOA_API_KEY: 'my-key' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProducts(envWithKey);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('api_key=my-key');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchProducts(env)).rejects.toThrow(
      'MOA API error: 500 Internal Server Error'
    );
  });

  it('throws on unexpected format (non-array)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'not an array' }),
    });

    await expect(fetchProducts(env)).rejects.toThrow(
      'MOA API returned unexpected format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchProducts(env)).rejects.toThrow('Network error');
  });
});

describe('isVegetable', () => {
  it('identifies vegetable by 種類名稱', () => {
    const product: AgriProduct = { '種類名稱': '蔬菜類', '作物名稱': '空心菜' };
    expect(isVegetable(product)).toBe(true);
  });

  it('identifies vegetable by 種類代碼 starting with L', () => {
    const product: AgriProduct = { '種類代碼': 'LA', '作物名稱': '小白菜' };
    expect(isVegetable(product)).toBe(true);
  });

  it('identifies vegetable by name pattern', () => {
    const product: AgriProduct = { '作物名稱': '高麗菜' };
    expect(isVegetable(product)).toBe(true);
  });

  it('does not identify fruit as vegetable', () => {
    const product: AgriProduct = { '種類名稱': '水果類', '種類代碼': 'FA', '作物名稱': '蘋果' };
    expect(isVegetable(product)).toBe(false);
  });
});

describe('isFruit', () => {
  it('identifies fruit by 種類名稱', () => {
    const product: AgriProduct = { '種類名稱': '水果類', '作物名稱': '蘋果' };
    expect(isFruit(product)).toBe(true);
  });

  it('identifies fruit by 種類代碼 starting with F', () => {
    const product: AgriProduct = { '種類代碼': 'FA', '作物名稱': '香蕉' };
    expect(isFruit(product)).toBe(true);
  });

  it('identifies fruit by name pattern', () => {
    const product: AgriProduct = { '作物名稱': '香蕉' };
    expect(isFruit(product)).toBe(true);
  });

  it('does not identify vegetable as fruit', () => {
    const product: AgriProduct = { '種類名稱': '蔬菜類', '種類代碼': 'LA', '作物名稱': '空心菜' };
    expect(isFruit(product)).toBe(false);
  });
});
