import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ENDPOINTS,
  fetchMarketSummary,
  fetchMarketIndices,
  fetchTopVolume,
  fetchValuation,
  fetchStockDayAll,
} from '../src/client.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ENDPOINTS', () => {
  it('has all expected endpoint paths', () => {
    expect(ENDPOINTS.MARKET_SUMMARY).toBe('/exchangeReport/FMTQIK');
    expect(ENDPOINTS.MARKET_INDICES).toBe('/exchangeReport/MI_INDEX');
    expect(ENDPOINTS.TOP_VOLUME).toBe('/exchangeReport/MI_INDEX20');
    expect(ENDPOINTS.VALUATION).toBe('/exchangeReport/BWIBBU_ALL');
    expect(ENDPOINTS.STOCK_DAY).toBe('/exchangeReport/STOCK_DAY_ALL');
  });
});

describe('fetchMarketSummary', () => {
  it('returns array of market summaries', async () => {
    const mock = [{ Date: '1150316', TAIEX: '33342.51', Change: '-57.81' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchMarketSummary();
    expect(result).toEqual(mock);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchMarketSummary()).rejects.toThrow('TWSE API error: 500');
  });

  it('throws on non-array response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ error: true }) })
    );
    await expect(fetchMarketSummary()).rejects.toThrow('unexpected format');
  });
});

describe('fetchMarketIndices', () => {
  it('returns array of indices', async () => {
    const mock = [{ '指數': '加權指數', '收盤指數': '33342' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchMarketIndices();
    expect(result).toEqual(mock);
  });
});

describe('fetchTopVolume', () => {
  it('returns array of top volume stocks', async () => {
    const mock = [{ Code: '2330', Name: '台積電', TradeVolume: '12345' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchTopVolume();
    expect(result).toEqual(mock);
  });
});

describe('fetchValuation', () => {
  it('returns array of stock valuations', async () => {
    const mock = [{ Code: '2330', Name: '台積電', PEratio: '25.83' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchValuation();
    expect(result).toEqual(mock);
  });
});

describe('fetchStockDayAll', () => {
  it('returns array of daily stock data', async () => {
    const mock = [{ Code: '2330', Name: '台積電', ClosingPrice: '595.00' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchStockDayAll();
    expect(result).toEqual(mock);
  });
});
