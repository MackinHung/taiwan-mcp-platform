import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  CUSTOMS_BASE: 'https://opendata.customs.gov.tw',
  TRADE_BASE: 'https://www.trade.gov.tw/OpenData/getOpenData.aspx',
  OPENDATA_BASE: 'https://data.gov.tw/api/v2/rest/datastore',
  fetchTradeStats: vi.fn(),
  fetchTraders: vi.fn(),
  fetchTariffs: vi.fn(),
  fetchCustomsData: vi.fn(),
  fetchTradeData: vi.fn(),
  fetchOpenData: vi.fn(),
  parseCsv: vi.fn(),
}));

import { fetchTradeStats, fetchTraders, fetchTariffs } from '../src/client.js';
import { getTradeStatistics } from '../src/tools/trade-stats.js';
import { lookupTrader } from '../src/tools/trader-lookup.js';
import { lookupTariff } from '../src/tools/tariff-lookup.js';
import { getTopTradePartners } from '../src/tools/top-trade-partners.js';
import { lookupHsCode } from '../src/tools/hs-code-lookup.js';

const mockTradeStats = vi.mocked(fetchTradeStats);
const mockTraders = vi.mocked(fetchTraders);
const mockTariffs = vi.mocked(fetchTariffs);

const env: Env = { SERVER_NAME: 'taiwan-customs', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getTradeStatistics ─────────────────────────────

describe('getTradeStatistics', () => {
  const sampleStats = [
    { 年月: '202401', 國家: '美國', 貨品名稱: '積體電路', 貨品號列: '8542', 進口值: '1000000', 出口值: '2500000', 單位: '千美元' },
    { 年月: '202401', 國家: '日本', 貨品名稱: '半導體設備', 貨品號列: '8486', 進口值: '800000', 出口值: '200000', 單位: '千美元' },
    { 年月: '202402', 國家: '美國', 貨品名稱: '電腦零件', 貨品號列: '8473', 進口值: '500000', 出口值: '900000', 單位: '千美元' },
  ];

  it('returns all trade statistics', async () => {
    mockTradeStats.mockResolvedValueOnce(sampleStats);

    const result = await getTradeStatistics(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('台灣進出口貿易統計');
    expect(text).toContain('美國');
    expect(text).toContain('日本');
  });

  it('filters by country', async () => {
    mockTradeStats.mockResolvedValueOnce(sampleStats);

    const result = await getTradeStatistics(env, { country: '日本' });
    const text = result.content[0].text;
    expect(text).toContain('日本');
    expect(text).toContain('1 筆');
  });

  it('filters by commodity', async () => {
    mockTradeStats.mockResolvedValueOnce(sampleStats);

    const result = await getTradeStatistics(env, { commodity: '積體電路' });
    const text = result.content[0].text;
    expect(text).toContain('積體電路');
    expect(text).toContain('1 筆');
  });

  it('returns no-result message when empty', async () => {
    mockTradeStats.mockResolvedValueOnce([]);

    const result = await getTradeStatistics(env, { country: '不存在國家' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockTradeStats.mockRejectedValueOnce(new Error('timeout'));

    const result = await getTradeStatistics(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// ─── lookupTrader ───────────────────────────────────

describe('lookupTrader', () => {
  const sampleTraders = [
    { 統一編號: '12345678', 廠商名稱: '台灣半導體公司', 廠商地址: '台北市信義區', 電話: '02-12345678', 登記日期: '20100301', 營業項目: '電子零件進出口' },
    { 統一編號: '87654321', 廠商名稱: '日月光科技', 廠商地址: '高雄市楠梓區', 電話: '07-87654321', 登記日期: '20050601', 營業項目: '半導體封測' },
  ];

  it('searches by company name', async () => {
    mockTraders.mockResolvedValueOnce(sampleTraders);

    const result = await lookupTrader(env, { keyword: '半導體' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('台灣半導體公司');
    expect(text).toContain('12345678');
  });

  it('searches by tax ID', async () => {
    mockTraders.mockResolvedValueOnce(sampleTraders);

    const result = await lookupTrader(env, { keyword: '87654321' });
    const text = result.content[0].text;
    expect(text).toContain('日月光科技');
    expect(text).toContain('1 筆');
  });

  it('returns error when keyword missing', async () => {
    const result = await lookupTrader(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns message when no match', async () => {
    mockTraders.mockResolvedValueOnce(sampleTraders);

    const result = await lookupTrader(env, { keyword: '不存在公司' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockTraders.mockRejectedValueOnce(new Error('connection refused'));

    const result = await lookupTrader(env, { keyword: '台積電' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

// ─── lookupTariff ───────────────────────────────────

describe('lookupTariff', () => {
  const sampleTariffs = [
    { 稅則號別: '8471.30.00', 貨名: '攜帶式自動資料處理機', 稅率: '0%', 單位: '台' },
    { 稅則號別: '8471.41.00', 貨名: '其他自動資料處理機', 稅率: '0%', 單位: '台' },
    { 稅則號別: '8542.31.00', 貨名: '積體電路處理器', 稅率: '0%', 單位: '個' },
  ];

  it('searches by tariff code', async () => {
    mockTariffs.mockResolvedValueOnce(sampleTariffs);

    const result = await lookupTariff(env, { keyword: '8471' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('8471.30.00');
    expect(text).toContain('攜帶式');
    expect(text).toContain('2 筆');
  });

  it('searches by product name', async () => {
    mockTariffs.mockResolvedValueOnce(sampleTariffs);

    const result = await lookupTariff(env, { keyword: '積體電路' });
    const text = result.content[0].text;
    expect(text).toContain('8542.31.00');
    expect(text).toContain('1 筆');
  });

  it('returns error when keyword missing', async () => {
    const result = await lookupTariff(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns message when no match', async () => {
    mockTariffs.mockResolvedValueOnce(sampleTariffs);

    const result = await lookupTariff(env, { keyword: '不存在產品' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockTariffs.mockRejectedValueOnce(new Error('server error'));

    const result = await lookupTariff(env, { keyword: '8471' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// ─── getTopTradePartners ────────────────────────────

describe('getTopTradePartners', () => {
  const sampleStats = [
    { 年月: '202401', 國家: '美國', 進口值: '5000000', 出口值: '8000000' },
    { 年月: '202401', 國家: '日本', 進口值: '4000000', 出口值: '3000000' },
    { 年月: '202401', 國家: '中國大陸', 進口值: '6000000', 出口值: '7000000' },
    { 年月: '202402', 國家: '美國', 進口值: '5500000', 出口值: '8500000' },
  ];

  it('returns top partners by total trade', async () => {
    mockTradeStats.mockResolvedValueOnce(sampleStats);

    const result = await getTopTradePartners(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('主要貿易夥伴排名');
    expect(text).toContain('美國');
    expect(text).toContain('佔比');
  });

  it('sorts by import when type=import', async () => {
    mockTradeStats.mockResolvedValueOnce(sampleStats);

    const result = await getTopTradePartners(env, { type: 'import' });
    const text = result.content[0].text;
    expect(text).toContain('進口');
    // 美國 has 10500000 import, 中國大陸 has 6000000, 日本 4000000
    const usIdx = text.indexOf('美國');
    const cnIdx = text.indexOf('中國大陸');
    expect(usIdx).toBeLessThan(cnIdx);
  });

  it('handles empty data', async () => {
    mockTradeStats.mockResolvedValueOnce([]);

    const result = await getTopTradePartners(env, {});
    expect(result.content[0].text).toContain('無可用');
  });

  it('handles API error', async () => {
    mockTradeStats.mockRejectedValueOnce(new Error('down'));

    const result = await getTopTradePartners(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('down');
  });
});

// ─── lookupHsCode ───────────────────────────────────

describe('lookupHsCode', () => {
  it('returns chapter info for numeric code', async () => {
    const result = await lookupHsCode(env, { code: '8471' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('機械及電機設備');
    expect(text).toContain('半導體');
    expect(text).toContain('8471');
  });

  it('returns chapter info for 2-digit code', async () => {
    const result = await lookupHsCode(env, { code: '27' });
    const text = result.content[0].text;
    expect(text).toContain('礦物產品');
  });

  it('returns error when code param missing', async () => {
    const result = await lookupHsCode(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供 HS 代碼');
  });

  it('returns not-found for invalid code', async () => {
    const result = await lookupHsCode(env, { code: '99' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('matches by description keyword', async () => {
    const result = await lookupHsCode(env, { code: '紡織' });
    const text = result.content[0].text;
    expect(text).toContain('紡織品');
  });
});
