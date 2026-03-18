import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchProducts: vi.fn(),
  isVegetable: vi.fn((p: any) => {
    const typeName = p['種類名稱'] ?? '';
    const typeCode = p['種類代碼'] ?? '';
    return (
      typeName.includes('蔬菜') ||
      typeCode.startsWith('L') ||
      /菜|瓜|豆|蘿蔔|蔥|蒜|薑|芹|筍|茄/.test(p['作物名稱'] ?? '')
    );
  }),
  isFruit: vi.fn((p: any) => {
    const typeName = p['種類名稱'] ?? '';
    const typeCode = p['種類代碼'] ?? '';
    return (
      typeName.includes('水果') ||
      typeCode.startsWith('F') ||
      /蕉|梨|蘋果|柑|橘|芒果|鳳梨|荔枝|龍眼|葡萄|西瓜|木瓜|芭樂|棗|柿|桃|梅|李/.test(p['作物名稱'] ?? '')
    );
  }),
  buildUrl: vi.fn(),
  VEGETABLE_TYPES: [],
  FRUIT_TYPES: [],
}));

import { fetchProducts } from '../src/client.js';
import { getVegetablePrices } from '../src/tools/vegetable-prices.js';
import { getFruitPrices } from '../src/tools/fruit-prices.js';
import { searchProductPrice } from '../src/tools/search-product.js';
import { getMarketSummary } from '../src/tools/market-summary.js';
import { comparePrices } from '../src/tools/compare-prices.js';
import type { Env } from '../src/types.js';

const mockFetchProducts = vi.mocked(fetchProducts);

const env: Env = {
  SERVER_NAME: 'taiwan-agri-price',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchProducts.mockReset();
});

// --- Vegetable Prices ---
describe('getVegetablePrices', () => {
  const sampleProducts = [
    {
      '作物名稱': '高麗菜',
      '市場名稱': '台北一',
      '種類名稱': '蔬菜類',
      '種類代碼': 'LA',
      '上價': '35.0',
      '中價': '25.0',
      '下價': '15.0',
      '平均價': '25.0',
      '交易量': '10000',
    },
    {
      '作物名稱': '香蕉',
      '市場名稱': '台北一',
      '種類名稱': '水果類',
      '種類代碼': 'FA',
      '上價': '40.0',
      '中價': '30.0',
      '下價': '20.0',
      '平均價': '30.0',
      '交易量': '5000',
    },
  ];

  it('returns vegetable data filtered from all products', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await getVegetablePrices(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('高麗菜');
    expect(result.content[0].text).toContain('蔬菜批發行情');
    expect(result.content[0].text).not.toContain('香蕉');
  });

  it('filters by market name', async () => {
    const products = [
      { '作物名稱': '高麗菜', '市場名稱': '台北一', '種類名稱': '蔬菜類', '平均價': '25.0', '交易量': '1000' },
      { '作物名稱': '小白菜', '市場名稱': '三重', '種類名稱': '蔬菜類', '平均價': '20.0', '交易量': '500' },
    ];
    mockFetchProducts.mockResolvedValueOnce(products);
    const result = await getVegetablePrices(env, { market: '台北' });
    expect(result.content[0].text).toContain('高麗菜');
    expect(result.content[0].text).not.toContain('三重');
  });

  it('handles empty results', async () => {
    mockFetchProducts.mockResolvedValueOnce([]);
    const result = await getVegetablePrices(env, { market: '不存在市場' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchProducts.mockRejectedValueOnce(new Error('API down'));
    const result = await getVegetablePrices(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('respects limit parameter', async () => {
    const manyProducts = Array.from({ length: 50 }, (_, i) => ({
      '作物名稱': `蔬菜${i}`,
      '市場名稱': '台北一',
      '種類名稱': '蔬菜類',
      '平均價': '10.0',
      '交易量': '100',
    }));
    mockFetchProducts.mockResolvedValueOnce(manyProducts);
    const result = await getVegetablePrices(env, { limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });
});

// --- Fruit Prices ---
describe('getFruitPrices', () => {
  const sampleProducts = [
    {
      '作物名稱': '香蕉',
      '市場名稱': '台北一',
      '種類名稱': '水果類',
      '種類代碼': 'FA',
      '上價': '40.0',
      '中價': '30.0',
      '下價': '20.0',
      '平均價': '30.0',
      '交易量': '5000',
    },
    {
      '作物名稱': '高麗菜',
      '市場名稱': '台北一',
      '種類名稱': '蔬菜類',
      '種類代碼': 'LA',
      '平均價': '25.0',
      '交易量': '10000',
    },
  ];

  it('returns fruit data filtered from all products', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await getFruitPrices(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('香蕉');
    expect(result.content[0].text).toContain('水果批發行情');
    expect(result.content[0].text).not.toContain('高麗菜');
  });

  it('filters by market name', async () => {
    const products = [
      { '作物名稱': '香蕉', '市場名稱': '台北一', '種類名稱': '水果類', '平均價': '30.0', '交易量': '5000' },
      { '作物名稱': '蘋果', '市場名稱': '三重', '種類名稱': '水果類', '平均價': '50.0', '交易量': '2000' },
    ];
    mockFetchProducts.mockResolvedValueOnce(products);
    const result = await getFruitPrices(env, { market: '三重' });
    expect(result.content[0].text).toContain('蘋果');
    expect(result.content[0].text).not.toContain('台北');
  });

  it('handles empty results', async () => {
    mockFetchProducts.mockResolvedValueOnce([]);
    const result = await getFruitPrices(env, {});
    expect(result.content[0].text).toContain('查無水果行情資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchProducts.mockRejectedValueOnce(new Error('timeout'));
    const result = await getFruitPrices(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Search Product Price ---
describe('searchProductPrice', () => {
  const sampleProducts = [
    { '作物名稱': '高麗菜', '市場名稱': '台北一', '平均價': '25.0', '交易量': '10000', '交易日期': '114.03.18' },
    { '作物名稱': '高麗菜', '市場名稱': '三重', '平均價': '22.0', '交易量': '5000', '交易日期': '114.03.18' },
    { '作物名稱': '香蕉', '市場名稱': '台北一', '平均價': '30.0', '交易量': '5000', '交易日期': '114.03.18' },
  ];

  it('searches products by name', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await searchProductPrice(env, { product: '高麗菜' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('高麗菜');
    expect(result.content[0].text).toContain('搜尋');
    expect(result.content[0].text).not.toContain('香蕉');
  });

  it('returns no results message when nothing matches', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await searchProductPrice(env, { product: '完全不存在的農產品' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error when product is empty', async () => {
    const result = await searchProductPrice(env, { product: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供農產品名稱');
  });

  it('returns error when product is missing', async () => {
    const result = await searchProductPrice(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供農產品名稱');
  });

  it('handles API error gracefully', async () => {
    mockFetchProducts.mockRejectedValueOnce(new Error('server error'));
    const result = await searchProductPrice(env, { product: '高麗菜' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('respects limit parameter', async () => {
    const manyProducts = Array.from({ length: 50 }, (_, i) => ({
      '作物名稱': `高麗菜${i}號`,
      '市場名稱': `市場${i}`,
      '平均價': '20.0',
      '交易量': '100',
    }));
    mockFetchProducts.mockResolvedValueOnce(manyProducts);
    const result = await searchProductPrice(env, { product: '高麗菜', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });
});

// --- Market Summary ---
describe('getMarketSummary', () => {
  const sampleProducts = [
    { '作物名稱': '高麗菜', '市場名稱': '台北一', '平均價': '25.0', '交易量': '10000', '交易日期': '114.03.18' },
    { '作物名稱': '香蕉', '市場名稱': '台北一', '平均價': '30.0', '交易量': '5000', '交易日期': '114.03.18' },
    { '作物名稱': '蘋果', '市場名稱': '三重', '平均價': '50.0', '交易量': '2000', '交易日期': '114.03.18' },
  ];

  it('returns market summary with stats', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await getMarketSummary(env, { market: '台北' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北一');
    expect(result.content[0].text).toContain('交易品項數');
    expect(result.content[0].text).toContain('總交易量');
    expect(result.content[0].text).toContain('當日交易概況');
  });

  it('returns error when market is missing', async () => {
    const result = await getMarketSummary(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供市場名稱');
  });

  it('returns error when market is empty', async () => {
    const result = await getMarketSummary(env, { market: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供市場名稱');
  });

  it('handles no data for market', async () => {
    mockFetchProducts.mockResolvedValueOnce([]);
    const result = await getMarketSummary(env, { market: '不存在' });
    expect(result.content[0].text).toContain('查無市場「不存在」的交易資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchProducts.mockRejectedValueOnce(new Error('API down'));
    const result = await getMarketSummary(env, { market: '台北' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Compare Prices ---
describe('comparePrices', () => {
  const sampleProducts = [
    { '作物名稱': '高麗菜', '市場名稱': '台北一', '平均價': '25.0', '交易量': '10000' },
    { '作物名稱': '高麗菜', '市場名稱': '三重', '平均價': '22.0', '交易量': '5000' },
    { '作物名稱': '高麗菜', '市場名稱': '西螺', '平均價': '20.0', '交易量': '8000' },
    { '作物名稱': '香蕉', '市場名稱': '台北一', '平均價': '30.0', '交易量': '5000' },
  ];

  it('compares prices across all markets for a product', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await comparePrices(env, { product: '高麗菜' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('跨市場價格比較');
    expect(result.content[0].text).toContain('台北一');
    expect(result.content[0].text).toContain('三重');
    expect(result.content[0].text).toContain('西螺');
  });

  it('filters by specified markets', async () => {
    mockFetchProducts.mockResolvedValueOnce(sampleProducts);
    const result = await comparePrices(env, { product: '高麗菜', markets: '台北,三重' });
    expect(result.content[0].text).toContain('台北一');
    expect(result.content[0].text).toContain('三重');
    expect(result.content[0].text).not.toContain('西螺');
  });

  it('returns error when product is missing', async () => {
    const result = await comparePrices(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供農產品名稱');
  });

  it('returns error when product is empty', async () => {
    const result = await comparePrices(env, { product: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供農產品名稱');
  });

  it('handles no matching products', async () => {
    mockFetchProducts.mockResolvedValueOnce([]);
    const result = await comparePrices(env, { product: '不存在的農產品' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchProducts.mockRejectedValueOnce(new Error('network failure'));
    const result = await comparePrices(env, { product: '高麗菜' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network failure');
  });
});
