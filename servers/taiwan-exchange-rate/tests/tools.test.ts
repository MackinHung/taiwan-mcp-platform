import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  parseCsv: vi.fn(),
  fetchRates: vi.fn(),
}));

import { fetchRates } from '../src/client.js';
import { getCurrentRates } from '../src/tools/current-rates.js';
import { getRateByCurrency } from '../src/tools/rate-by-currency.js';
import { getHistoricalRate } from '../src/tools/historical-rate.js';
import { convertCurrency } from '../src/tools/convert-currency.js';
import { compareRates } from '../src/tools/rate-comparison.js';
import type { Env, ExchangeRate } from '../src/types.js';

const mockFetchRates = vi.mocked(fetchRates);

const env: Env = {
  SERVER_NAME: 'taiwan-exchange-rate',
  SERVER_VERSION: '1.0.0',
};

const sampleRates: ExchangeRate[] = [
  { currency: '美金', currencyCode: 'USD', cashBuying: '30.995', cashSelling: '31.145', spotBuying: '30.835', spotSelling: '31.035' },
  { currency: '歐元', currencyCode: 'EUR', cashBuying: '33.24', cashSelling: '34.04', spotBuying: '33.41', spotSelling: '33.81' },
  { currency: '日圓', currencyCode: 'JPY', cashBuying: '0.2052', cashSelling: '0.2132', spotBuying: '0.2072', spotSelling: '0.2112' },
  { currency: '英鎊', currencyCode: 'GBP', cashBuying: '39.33', cashSelling: '40.53', spotBuying: '39.69', spotSelling: '40.09' },
  { currency: '港幣', currencyCode: 'HKD', cashBuying: '3.888', cashSelling: '4.028', spotBuying: '3.948', spotSelling: '3.998' },
  { currency: '人民幣', currencyCode: 'CNY', cashBuying: '4.115', cashSelling: '4.305', spotBuying: '4.215', spotSelling: '4.275' },
  { currency: '韓元', currencyCode: 'KRW', cashBuying: '0.02086', cashSelling: '0.02266', spotBuying: '0.02166', spotSelling: '0.02226' },
];

beforeEach(() => {
  mockFetchRates.mockReset();
});

// --- get_current_rates ---
describe('getCurrentRates', () => {
  it('returns all rates in table format', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getCurrentRates(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('今日臺灣銀行匯率');
    expect(result.content[0].text).toContain('共 7 種幣別');
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('EUR');
    expect(result.content[0].text).toContain('JPY');
  });

  it('handles empty rates', async () => {
    mockFetchRates.mockResolvedValueOnce([]);
    const result = await getCurrentRates(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('目前無匯率資料');
  });

  it('ignores unknown arguments gracefully', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getCurrentRates(env, { unknown: 'param' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('USD');
  });

  it('handles API error gracefully', async () => {
    mockFetchRates.mockRejectedValueOnce(new Error('API down'));
    const result = await getCurrentRates(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- get_rate_by_currency ---
describe('getRateByCurrency', () => {
  it('returns specific currency rate', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getRateByCurrency(env, { currency: 'USD' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('美金');
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('30.835');
    expect(result.content[0].text).toContain('31.035');
  });

  it('handles currency not found', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getRateByCurrency(env, { currency: 'XYZ' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('找不到幣別 XYZ');
  });

  it('handles case-insensitive currency code', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getRateByCurrency(env, { currency: 'usd' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('美金');
  });

  it('returns error when currency not provided', async () => {
    const result = await getRateByCurrency(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供幣別代碼');
  });

  it('handles API error gracefully', async () => {
    mockFetchRates.mockRejectedValueOnce(new Error('timeout'));
    const result = await getRateByCurrency(env, { currency: 'USD' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- get_historical_rate ---
describe('getHistoricalRate', () => {
  it('returns historical rates for a specific date', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getHistoricalRate(env, { date: '2026-03-15' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('2026-03-15');
    expect(result.content[0].text).toContain('USD');
    expect(mockFetchRates).toHaveBeenCalledWith('2026-03-15');
  });

  it('filters by currency when provided', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getHistoricalRate(env, { date: '2026-03-15', currency: 'JPY' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('日圓');
    expect(result.content[0].text).not.toContain('美金');
  });

  it('returns error when date not provided', async () => {
    const result = await getHistoricalRate(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供日期');
  });

  it('returns error for invalid date format', async () => {
    const result = await getHistoricalRate(env, { date: '20260315' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('日期格式錯誤');
  });

  it('handles empty result (non-business day)', async () => {
    mockFetchRates.mockResolvedValueOnce([]);
    const result = await getHistoricalRate(env, { date: '2026-03-15' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('無匯率資料');
    expect(result.content[0].text).toContain('非營業日');
  });

  it('handles currency not found in historical data', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await getHistoricalRate(env, { date: '2026-03-15', currency: 'XYZ' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('找不到幣別 XYZ');
  });

  it('handles API error gracefully', async () => {
    mockFetchRates.mockRejectedValueOnce(new Error('server error'));
    const result = await getHistoricalRate(env, { date: '2026-03-15' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- convert_currency ---
describe('convertCurrency', () => {
  it('converts TWD to foreign currency', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await convertCurrency(env, { from: 'TWD', to: 'USD', amount: 31035 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('TWD');
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('即期賣出匯率');
    expect(result.content[0].text).toContain('1000.00');
  });

  it('converts foreign currency to TWD', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await convertCurrency(env, { from: 'USD', to: 'TWD', amount: 100 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('TWD');
    expect(result.content[0].text).toContain('即期買入匯率');
    // 100 * 30.835 = 3083.50
    expect(result.content[0].text).toContain('3083.50');
  });

  it('converts foreign to foreign via TWD', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await convertCurrency(env, { from: 'USD', to: 'EUR', amount: 100 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('EUR');
  });

  it('returns error when parameters are missing', async () => {
    const result = await convertCurrency(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns error for negative amount', async () => {
    const result = await convertCurrency(env, { from: 'TWD', to: 'USD', amount: -100 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('正數');
  });

  it('handles same currency conversion', async () => {
    const result = await convertCurrency(env, { from: 'USD', to: 'USD', amount: 100 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('相同幣別');
  });

  it('handles currency not found', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await convertCurrency(env, { from: 'TWD', to: 'XYZ', amount: 1000 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('找不到幣別 XYZ');
  });

  it('handles API error gracefully', async () => {
    mockFetchRates.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await convertCurrency(env, { from: 'TWD', to: 'USD', amount: 1000 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });
});

// --- compare_rates ---
describe('compareRates', () => {
  it('compares multiple currencies', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await compareRates(env, { currencies: 'USD,JPY,EUR' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('匯率比較');
    expect(result.content[0].text).toContain('3 種幣別');
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('JPY');
    expect(result.content[0].text).toContain('EUR');
  });

  it('handles partial match (some currencies not found)', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await compareRates(env, { currencies: 'USD,XYZ' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('找不到以下幣別: XYZ');
  });

  it('handles no currencies found', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await compareRates(env, { currencies: 'XYZ,ABC' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('找不到以下幣別的匯率資料');
  });

  it('returns error when currencies not provided', async () => {
    const result = await compareRates(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供要比較的幣別代碼');
  });

  it('handles case-insensitive currency codes', async () => {
    mockFetchRates.mockResolvedValueOnce(sampleRates);
    const result = await compareRates(env, { currencies: 'usd,jpy' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('USD');
    expect(result.content[0].text).toContain('JPY');
  });

  it('handles API error gracefully', async () => {
    mockFetchRates.mockRejectedValueOnce(new Error('network error'));
    const result = await compareRates(env, { currencies: 'USD,JPY' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network error');
  });
});
