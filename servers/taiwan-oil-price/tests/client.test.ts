import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchCurrentPrices,
  fetchPriceChanges,
  fetchPriceHistory,
  isValidFuelType,
  FUEL_TYPES,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('isValidFuelType', () => {
  it('returns true for valid fuel types', () => {
    expect(isValidFuelType('92')).toBe(true);
    expect(isValidFuelType('95')).toBe(true);
    expect(isValidFuelType('98')).toBe(true);
    expect(isValidFuelType('diesel')).toBe(true);
  });

  it('returns false for invalid fuel types', () => {
    expect(isValidFuelType('91')).toBe(false);
    expect(isValidFuelType('gasoline')).toBe(false);
    expect(isValidFuelType('')).toBe(false);
    expect(isValidFuelType('100')).toBe(false);
  });
});

describe('FUEL_TYPES', () => {
  it('contains all 4 fuel type mappings', () => {
    expect(Object.keys(FUEL_TYPES)).toHaveLength(4);
    expect(FUEL_TYPES['92']).toBe('92無鉛汽油');
    expect(FUEL_TYPES['95']).toBe('95無鉛汽油');
    expect(FUEL_TYPES['98']).toBe('98無鉛汽油');
    expect(FUEL_TYPES['diesel']).toBe('超級柴油');
  });
});

describe('fetchCurrentPrices', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses valid CPC API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        UpdateTime: '2026-03-17',
        PriceUpdate: [
          { ProdCode: '1', ProdName: '92無鉛汽油', Price: '29.5', EffectiveDate: '2026-03-17' },
          { ProdCode: '2', ProdName: '95無鉛汽油', Price: '31.0', EffectiveDate: '2026-03-17' },
          { ProdCode: '3', ProdName: '98無鉛汽油', Price: '33.0', EffectiveDate: '2026-03-17' },
          { ProdCode: '4', ProdName: '超級柴油', Price: '28.2', EffectiveDate: '2026-03-17' },
        ],
      }),
    });

    const { prices, source } = await fetchCurrentPrices();
    expect(source).toBe('api');
    expect(prices).toHaveLength(4);
    expect(prices[0].fuelType).toBe('92');
    expect(prices[0].price).toBe(29.5);
  });

  it('falls back to default prices when API returns non-200', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { prices, source } = await fetchCurrentPrices();
    expect(source).toBe('fallback');
    expect(prices).toHaveLength(4);
  });

  it('falls back to default prices when API returns invalid format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'format' }),
    });

    const { prices, source } = await fetchCurrentPrices();
    expect(source).toBe('fallback');
    expect(prices).toHaveLength(4);
  });

  it('falls back when network error occurs', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { prices, source } = await fetchCurrentPrices();
    expect(source).toBe('fallback');
    expect(prices).toHaveLength(4);
  });

  it('falls back when PriceUpdate array is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        UpdateTime: '2026-03-17',
        PriceUpdate: [],
      }),
    });

    const { prices, source } = await fetchCurrentPrices();
    expect(source).toBe('fallback');
    expect(prices).toHaveLength(4);
  });
});

describe('fetchPriceChanges', () => {
  it('returns price change data with 4 fuel types', async () => {
    const { changes, source } = await fetchPriceChanges();
    expect(source).toBe('fallback');
    expect(changes).toHaveLength(4);
    for (const c of changes) {
      expect(c).toHaveProperty('fuelType');
      expect(c).toHaveProperty('previousPrice');
      expect(c).toHaveProperty('currentPrice');
      expect(c).toHaveProperty('change');
      expect(c.change).toBe(c.currentPrice - c.previousPrice);
    }
  });
});

describe('fetchPriceHistory', () => {
  it('returns all fuel types when no filter specified', async () => {
    const { records, source } = await fetchPriceHistory();
    expect(source).toBe('fallback');
    expect(records.length).toBeGreaterThan(0);
    expect(records.length).toBeLessThanOrEqual(10);
  });

  it('filters by fuel type', async () => {
    const { records } = await fetchPriceHistory('95');
    for (const r of records) {
      expect(r.fuelType).toBe('95');
    }
  });

  it('respects limit parameter', async () => {
    const { records } = await fetchPriceHistory(undefined, 3);
    expect(records).toHaveLength(3);
  });

  it('sorts by date descending', async () => {
    const { records } = await fetchPriceHistory('95');
    for (let i = 1; i < records.length; i++) {
      expect(new Date(records[i - 1].effectiveDate).getTime())
        .toBeGreaterThanOrEqual(new Date(records[i].effectiveDate).getTime());
    }
  });

  it('filters by diesel type', async () => {
    const { records } = await fetchPriceHistory('diesel');
    for (const r of records) {
      expect(r.fuelType).toBe('diesel');
    }
  });
});
