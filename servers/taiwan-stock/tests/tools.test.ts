import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  ENDPOINTS: {},
  fetchMarketSummary: vi.fn(),
  fetchMarketIndices: vi.fn(),
  fetchTopVolume: vi.fn(),
  fetchValuation: vi.fn(),
  fetchStockDayAll: vi.fn(),
}));

import {
  fetchMarketSummary,
  fetchMarketIndices,
  fetchTopVolume,
  fetchValuation,
  fetchStockDayAll,
} from '../src/client.js';
import { getMarketOverview, getMarketIndices, getTopVolume } from '../src/tools/market.js';
import { getStockInfo, getStockSearch } from '../src/tools/stock.js';

const mockSummary = vi.mocked(fetchMarketSummary);
const mockIndices = vi.mocked(fetchMarketIndices);
const mockTopVol = vi.mocked(fetchTopVolume);
const mockValuation = vi.mocked(fetchValuation);
const mockStockDay = vi.mocked(fetchStockDayAll);

const env: Env = { SERVER_NAME: 'taiwan-stock', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getMarketOverview ───────────────────────────────

describe('getMarketOverview', () => {
  it('shows latest TAIEX and volume', async () => {
    mockSummary.mockResolvedValueOnce([
      { Date: '1150315', TradeVolume: '10000000000', TradeValue: '500000000000', Transaction: '5000000', TAIEX: '33400.00', Change: '+57.49' },
      { Date: '1150316', TradeVolume: '12000000000', TradeValue: '600000000000', Transaction: '6000000', TAIEX: '33342.51', Change: '-57.81' },
    ]);

    const result = await getMarketOverview(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('33342.51');
    expect(text).toContain('-57.81');
    expect(text).toContain('近期走勢');
  });

  it('handles empty data', async () => {
    mockSummary.mockResolvedValueOnce([]);

    const result = await getMarketOverview(env, {});
    expect(result.content[0].text).toContain('無可用');
  });

  it('handles API error', async () => {
    mockSummary.mockRejectedValueOnce(new Error('timeout'));

    const result = await getMarketOverview(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// ─── getMarketIndices ────────────────────────────────

describe('getMarketIndices', () => {
  const sampleIndices = [
    { '日期': '1150316', '指數': '發行量加權股價指數', '收盤指數': '33342.51', '漲跌': '-', '漲跌點數': '57.81', '漲跌百分比': '-0.17', '特殊處理註記': '' },
    { '日期': '1150316', '指數': '電子類報酬指數', '收盤指數': '1200.00', '漲跌': '+', '漲跌點數': '15.30', '漲跌百分比': '1.29', '特殊處理註記': '' },
    { '日期': '1150316', '指數': '金融保險類報酬指數', '收盤指數': '800.00', '漲跌': '+', '漲跌點數': '5.00', '漲跌百分比': '0.63', '特殊處理註記': '' },
  ];

  it('returns all indices when no keyword', async () => {
    mockIndices.mockResolvedValueOnce(sampleIndices);

    const result = await getMarketIndices(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('3 項');
    expect(result.content[0].text).toContain('加權');
    expect(result.content[0].text).toContain('電子');
  });

  it('filters by keyword', async () => {
    mockIndices.mockResolvedValueOnce(sampleIndices);

    const result = await getMarketIndices(env, { keyword: '電子' });
    expect(result.content[0].text).toContain('電子');
    expect(result.content[0].text).not.toContain('金融');
  });

  it('returns message when keyword not found', async () => {
    mockIndices.mockResolvedValueOnce(sampleIndices);

    const result = await getMarketIndices(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockIndices.mockRejectedValueOnce(new Error('fail'));
    const result = await getMarketIndices(env, {});
    expect(result.isError).toBe(true);
  });
});

// ─── getTopVolume ────────────────────────────────────

describe('getTopVolume', () => {
  const sampleTop = [
    { Date: '20260316', Rank: '1', Code: '3481', Name: '群創', TradeVolume: '1001913513', Transaction: '310382', OpeningPrice: '29.70', HighestPrice: '29.70', LowestPrice: '27.05', ClosingPrice: '27.30', Dir: '-', Change: '2.40', LastBestBidPrice: '27.30', LastBestAskPrice: '27.35' },
    { Date: '20260316', Rank: '2', Code: '00919', Name: '群益台灣精選高息', TradeVolume: '300652965', Transaction: '100000', OpeningPrice: '24.00', HighestPrice: '24.10', LowestPrice: '23.80', ClosingPrice: '23.91', Dir: '+', Change: '0.11', LastBestBidPrice: '23.91', LastBestAskPrice: '23.92' },
  ];

  it('returns top volume stocks', async () => {
    mockTopVol.mockResolvedValueOnce(sampleTop);

    const result = await getTopVolume(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('群創');
    expect(text).toContain('群益');
    expect(text).toContain('前 2 名');
  });

  it('respects limit parameter', async () => {
    mockTopVol.mockResolvedValueOnce(sampleTop);

    const result = await getTopVolume(env, { limit: 1 });
    const text = result.content[0].text;
    expect(text).toContain('前 1 名');
    expect(text).toContain('群創');
  });

  it('handles empty data', async () => {
    mockTopVol.mockResolvedValueOnce([]);
    const result = await getTopVolume(env, {});
    expect(result.content[0].text).toContain('無可用');
  });

  it('handles API error', async () => {
    mockTopVol.mockRejectedValueOnce(new Error('err'));
    const result = await getTopVolume(env, {});
    expect(result.isError).toBe(true);
  });
});

// ─── getStockInfo ────────────────────────────────────

describe('getStockInfo', () => {
  it('returns stock info with valuation and daily data', async () => {
    mockValuation.mockResolvedValueOnce([
      { Date: '1150316', Code: '2330', Name: '台積電', PEratio: '25.83', DividendYield: '2.02', PBratio: '6.50' },
    ]);
    mockStockDay.mockResolvedValueOnce([
      { Date: '1150316', Code: '2330', Name: '台積電', TradeVolume: '50000000', TradeValue: '29500000000', OpeningPrice: '590.00', HighestPrice: '596.00', LowestPrice: '588.00', ClosingPrice: '595.00', Change: '+5.00', Transaction: '80000' },
    ]);

    const result = await getStockInfo(env, { code: '2330' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('台積電');
    expect(text).toContain('595.00');
    expect(text).toContain('25.83');
    expect(text).toContain('2.02');
  });

  it('returns error when code param missing', async () => {
    const result = await getStockInfo(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供股票代碼');
  });

  it('returns message when stock not found', async () => {
    mockValuation.mockResolvedValueOnce([]);
    mockStockDay.mockResolvedValueOnce([]);

    const result = await getStockInfo(env, { code: '9999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockValuation.mockRejectedValueOnce(new Error('fail'));
    mockStockDay.mockRejectedValueOnce(new Error('fail'));

    const result = await getStockInfo(env, { code: '2330' });
    expect(result.isError).toBe(true);
  });
});

// ─── getStockSearch ──────────────────────────────────

describe('getStockSearch', () => {
  const sampleStocks = [
    { Date: '1150316', Code: '2330', Name: '台積電', TradeVolume: '50000000', TradeValue: '29500000000', OpeningPrice: '590.00', HighestPrice: '596.00', LowestPrice: '588.00', ClosingPrice: '595.00', Change: '+5.00', Transaction: '80000' },
    { Date: '1150316', Code: '2331', Name: '精英', TradeVolume: '1000000', TradeValue: '30000000', OpeningPrice: '30.00', HighestPrice: '31.00', LowestPrice: '29.50', ClosingPrice: '30.50', Change: '+0.50', Transaction: '5000' },
    { Date: '1150316', Code: '3711', Name: '日月光投控', TradeVolume: '20000000', TradeValue: '2000000000', OpeningPrice: '100.00', HighestPrice: '102.00', LowestPrice: '99.00', ClosingPrice: '101.00', Change: '+1.00', Transaction: '15000' },
  ];

  it('searches by code', async () => {
    mockStockDay.mockResolvedValueOnce(sampleStocks);

    const result = await getStockSearch(env, { keyword: '2330' });
    expect(result.content[0].text).toContain('台積電');
    expect(result.content[0].text).toContain('1 筆');
  });

  it('searches by name', async () => {
    mockStockDay.mockResolvedValueOnce(sampleStocks);

    const result = await getStockSearch(env, { keyword: '日月光' });
    expect(result.content[0].text).toContain('日月光');
    expect(result.content[0].text).toContain('3711');
  });

  it('returns error when keyword missing', async () => {
    const result = await getStockSearch(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns message when no match', async () => {
    mockStockDay.mockResolvedValueOnce(sampleStocks);

    const result = await getStockSearch(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockStockDay.mockRejectedValueOnce(new Error('down'));

    const result = await getStockSearch(env, { keyword: '台積' });
    expect(result.isError).toBe(true);
  });
});
