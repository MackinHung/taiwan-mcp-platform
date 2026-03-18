import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  FUEL_TYPES: {
    '92': '92無鉛汽油',
    '95': '95無鉛汽油',
    '98': '98無鉛汽油',
    diesel: '超級柴油',
  },
  isValidFuelType: vi.fn((type: string) =>
    ['92', '95', '98', 'diesel'].includes(type)
  ),
  fetchCurrentPrices: vi.fn(),
  fetchPriceChanges: vi.fn(),
  fetchPriceHistory: vi.fn(),
}));

import {
  fetchCurrentPrices,
  fetchPriceChanges,
  fetchPriceHistory,
} from '../src/client.js';
import { getCurrentPrices } from '../src/tools/current-prices.js';
import { getPriceByType } from '../src/tools/price-by-type.js';
import { getPriceHistory } from '../src/tools/price-history.js';
import { getPriceChange } from '../src/tools/price-change.js';
import { calculateFuelCost } from '../src/tools/fuel-cost.js';
import type { Env } from '../src/types.js';

const mockFetchCurrentPrices = vi.mocked(fetchCurrentPrices);
const mockFetchPriceChanges = vi.mocked(fetchPriceChanges);
const mockFetchPriceHistory = vi.mocked(fetchPriceHistory);

const env: Env = {
  SERVER_NAME: 'taiwan-oil-price',
  SERVER_VERSION: '1.0.0',
};

const samplePrices = {
  prices: [
    { fuelType: '92' as const, fuelName: '92無鉛汽油', price: 29.5, unit: '元/公升', effectiveDate: '2026-03-17' },
    { fuelType: '95' as const, fuelName: '95無鉛汽油', price: 31.0, unit: '元/公升', effectiveDate: '2026-03-17' },
    { fuelType: '98' as const, fuelName: '98無鉛汽油', price: 33.0, unit: '元/公升', effectiveDate: '2026-03-17' },
    { fuelType: 'diesel' as const, fuelName: '超級柴油', price: 28.2, unit: '元/公升', effectiveDate: '2026-03-17' },
  ],
  source: 'fallback' as const,
};

beforeEach(() => {
  mockFetchCurrentPrices.mockReset();
  mockFetchPriceChanges.mockReset();
  mockFetchPriceHistory.mockReset();
});

// --- Current Prices ---
describe('getCurrentPrices', () => {
  it('returns all fuel prices', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await getCurrentPrices(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('中油現行牌價');
    expect(text).toContain('92無鉛汽油');
    expect(text).toContain('95無鉛汽油');
    expect(text).toContain('98無鉛汽油');
    expect(text).toContain('超級柴油');
    expect(text).toContain('29.5');
  });

  it('handles empty prices', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce({
      prices: [],
      source: 'fallback' as const,
    });
    const result = await getCurrentPrices(env, {});
    expect(result.content[0].text).toContain('目前無法取得油價資料');
  });

  it('shows fallback source note', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await getCurrentPrices(env, {});
    expect(result.content[0].text).toContain('離線備份資料');
  });

  it('shows API source note for live data', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce({
      ...samplePrices,
      source: 'api' as const,
    });
    const result = await getCurrentPrices(env, {});
    expect(result.content[0].text).toContain('中油 OpenData API');
  });

  it('handles API error gracefully', async () => {
    mockFetchCurrentPrices.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getCurrentPrices(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

// --- Price By Type ---
describe('getPriceByType', () => {
  it('returns price for specific fuel type', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await getPriceByType(env, { fuelType: '95' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('95無鉛汽油');
    expect(text).toContain('31.0');
  });

  it('returns error when fuelType is missing', async () => {
    const result = await getPriceByType(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供燃料類型');
  });

  it('returns error for invalid fuel type', async () => {
    const result = await getPriceByType(env, { fuelType: '91' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的燃料類型');
  });

  it('returns diesel price', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await getPriceByType(env, { fuelType: 'diesel' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('超級柴油');
    expect(result.content[0].text).toContain('28.2');
  });

  it('handles API error gracefully', async () => {
    mockFetchCurrentPrices.mockRejectedValueOnce(new Error('API down'));
    const result = await getPriceByType(env, { fuelType: '95' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Price History ---
describe('getPriceHistory', () => {
  const sampleHistory = {
    records: [
      { fuelType: '95' as const, fuelName: '95無鉛汽油', price: 31.0, effectiveDate: '2026-03-17' },
      { fuelType: '95' as const, fuelName: '95無鉛汽油', price: 30.8, effectiveDate: '2026-03-10' },
      { fuelType: '95' as const, fuelName: '95無鉛汽油', price: 30.5, effectiveDate: '2026-03-03' },
    ],
    source: 'fallback' as const,
  };

  it('returns price history for specific fuel type', async () => {
    mockFetchPriceHistory.mockResolvedValueOnce(sampleHistory);
    const result = await getPriceHistory(env, { fuelType: '95' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('歷史油價');
    expect(text).toContain('95無鉛汽油');
    expect(text).toContain('顯示 3 筆');
  });

  it('returns all fuel types history when no filter', async () => {
    mockFetchPriceHistory.mockResolvedValueOnce({
      records: [
        { fuelType: '92' as const, fuelName: '92無鉛汽油', price: 29.5, effectiveDate: '2026-03-17' },
        { fuelType: '95' as const, fuelName: '95無鉛汽油', price: 31.0, effectiveDate: '2026-03-17' },
      ],
      source: 'fallback' as const,
    });
    const result = await getPriceHistory(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('所有燃料');
  });

  it('handles empty history', async () => {
    mockFetchPriceHistory.mockResolvedValueOnce({
      records: [],
      source: 'fallback' as const,
    });
    const result = await getPriceHistory(env, { fuelType: '92' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid fuel type', async () => {
    const result = await getPriceHistory(env, { fuelType: '91' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的燃料類型');
  });

  it('handles API error gracefully', async () => {
    mockFetchPriceHistory.mockRejectedValueOnce(new Error('timeout'));
    const result = await getPriceHistory(env, { fuelType: '95' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Price Change ---
describe('getPriceChange', () => {
  const sampleChanges = {
    changes: [
      { fuelType: '92' as const, fuelName: '92無鉛汽油', previousPrice: 29.3, currentPrice: 29.5, change: 0.2, effectiveDate: '2026-03-17' },
      { fuelType: '95' as const, fuelName: '95無鉛汽油', previousPrice: 30.8, currentPrice: 31.0, change: 0.2, effectiveDate: '2026-03-17' },
      { fuelType: '98' as const, fuelName: '98無鉛汽油', previousPrice: 32.8, currentPrice: 33.0, change: 0.2, effectiveDate: '2026-03-17' },
      { fuelType: 'diesel' as const, fuelName: '超級柴油', previousPrice: 28.0, currentPrice: 28.2, change: 0.2, effectiveDate: '2026-03-17' },
    ],
    source: 'fallback' as const,
  };

  it('returns price changes for all fuel types', async () => {
    mockFetchPriceChanges.mockResolvedValueOnce(sampleChanges);
    const result = await getPriceChange(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('本週油價調整幅度');
    expect(text).toContain('92無鉛汽油');
    expect(text).toContain('95無鉛汽油');
    expect(text).toContain('+0.2');
    expect(text).toContain('↑');
  });

  it('handles empty changes', async () => {
    mockFetchPriceChanges.mockResolvedValueOnce({
      changes: [],
      source: 'fallback' as const,
    });
    const result = await getPriceChange(env, {});
    expect(result.content[0].text).toContain('目前無法取得調價資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchPriceChanges.mockRejectedValueOnce(new Error('server error'));
    const result = await getPriceChange(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('shows down arrow for price decrease', async () => {
    mockFetchPriceChanges.mockResolvedValueOnce({
      changes: [
        { fuelType: '92' as const, fuelName: '92無鉛汽油', previousPrice: 30.0, currentPrice: 29.5, change: -0.5, effectiveDate: '2026-03-17' },
      ],
      source: 'fallback' as const,
    });
    const result = await getPriceChange(env, {});
    expect(result.content[0].text).toContain('↓');
    expect(result.content[0].text).toContain('-0.5');
  });
});

// --- Fuel Cost ---
describe('calculateFuelCost', () => {
  it('calculates cost from liters', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await calculateFuelCost(env, {
      fuelType: '95',
      liters: 30,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('油費計算結果');
    expect(text).toContain('95無鉛汽油');
    // 30 * 31.0 = 930.0
    expect(text).toContain('930.0');
  });

  it('calculates liters from amount', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await calculateFuelCost(env, {
      fuelType: '95',
      amount: 1000,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('可加油量');
    // 1000 / 31.0 ≈ 32.26
    expect(text).toContain('32.26');
  });

  it('returns error when fuelType is missing', async () => {
    const result = await calculateFuelCost(env, { liters: 30 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供燃料類型');
  });

  it('returns error for invalid fuel type', async () => {
    const result = await calculateFuelCost(env, {
      fuelType: '91',
      liters: 30,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的燃料類型');
  });

  it('returns error when neither liters nor amount provided', async () => {
    const result = await calculateFuelCost(env, { fuelType: '95' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供加油公升數');
  });

  it('returns error when both liters and amount provided', async () => {
    const result = await calculateFuelCost(env, {
      fuelType: '95',
      liters: 30,
      amount: 1000,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('只提供');
  });

  it('returns error for zero liters', async () => {
    const result = await calculateFuelCost(env, {
      fuelType: '95',
      liters: 0,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('公升數必須為大於 0');
  });

  it('returns error for negative amount', async () => {
    const result = await calculateFuelCost(env, {
      fuelType: '95',
      amount: -500,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('金額必須為大於 0');
  });

  it('handles API error gracefully', async () => {
    mockFetchCurrentPrices.mockRejectedValueOnce(new Error('network fail'));
    const result = await calculateFuelCost(env, {
      fuelType: '95',
      liters: 30,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network fail');
  });

  it('calculates diesel cost correctly', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);
    const result = await calculateFuelCost(env, {
      fuelType: 'diesel',
      liters: 50,
    });
    expect(result.isError).toBeUndefined();
    // 50 * 28.2 = 1410.0
    expect(result.content[0].text).toContain('1410.0');
  });
});
