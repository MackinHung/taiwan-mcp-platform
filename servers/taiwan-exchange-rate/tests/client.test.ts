import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, parseCsv, fetchRates } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const SAMPLE_CSV = `幣別,現金買入,現金賣出,即期買入,即期賣出
美金 (USD),30.995,31.145,30.835,31.035
歐元 (EUR),33.24,34.04,33.41,33.81
日圓 (JPY),0.2052,0.2132,0.2072,0.2112
英鎊 (GBP),39.33,40.53,39.69,40.09
港幣 (HKD),3.888,4.028,3.948,3.998
人民幣 (CNY),4.115,4.305,4.215,4.275
韓元 (KRW),0.02086,0.02266,0.02166,0.02226`;

describe('buildUrl', () => {
  it('returns today URL when no date provided', () => {
    const url = buildUrl();
    expect(url).toBe('https://rate.bot.com.tw/xrt/flcsv/0/day');
  });

  it('returns date-specific URL when date provided', () => {
    const url = buildUrl('2026-03-15');
    expect(url).toBe('https://rate.bot.com.tw/xrt/flcsv/0/2026-03-15');
  });

  it('handles undefined date same as no date', () => {
    const url = buildUrl(undefined);
    expect(url).toBe('https://rate.bot.com.tw/xrt/flcsv/0/day');
  });
});

describe('parseCsv', () => {
  it('parses multi-currency CSV correctly', () => {
    const rates = parseCsv(SAMPLE_CSV);
    expect(rates).toHaveLength(7);
  });

  it('extracts currency code from parentheses', () => {
    const rates = parseCsv(SAMPLE_CSV);
    expect(rates[0].currencyCode).toBe('USD');
    expect(rates[1].currencyCode).toBe('EUR');
    expect(rates[2].currencyCode).toBe('JPY');
  });

  it('extracts currency name without code', () => {
    const rates = parseCsv(SAMPLE_CSV);
    expect(rates[0].currency).toBe('美金');
    expect(rates[1].currency).toBe('歐元');
    expect(rates[2].currency).toBe('日圓');
  });

  it('extracts all rate values correctly', () => {
    const rates = parseCsv(SAMPLE_CSV);
    const usd = rates[0];
    expect(usd.cashBuying).toBe('30.995');
    expect(usd.cashSelling).toBe('31.145');
    expect(usd.spotBuying).toBe('30.835');
    expect(usd.spotSelling).toBe('31.035');
  });

  it('handles empty CSV (header only)', () => {
    const rates = parseCsv('幣別,現金買入,現金賣出,即期買入,即期賣出');
    expect(rates).toHaveLength(0);
  });

  it('skips malformed rows with fewer than 5 columns', () => {
    const csv = `幣別,現金買入,現金賣出,即期買入,即期賣出
美金 (USD),30.995,31.145,30.835,31.035
bad,row,only`;
    const rates = parseCsv(csv);
    expect(rates).toHaveLength(1);
    expect(rates[0].currencyCode).toBe('USD');
  });

  it('handles empty string input', () => {
    const rates = parseCsv('');
    expect(rates).toHaveLength(0);
  });
});

describe('fetchRates', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches today rates when no date provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_CSV,
    });

    const rates = await fetchRates();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://rate.bot.com.tw/xrt/flcsv/0/day');
    expect(rates).toHaveLength(7);
  });

  it('fetches historical rates when date provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_CSV,
    });

    await fetchRates('2026-03-15');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://rate.bot.com.tw/xrt/flcsv/0/2026-03-15');
  });

  it('throws on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchRates()).rejects.toThrow('BOT API error: 404 Not Found');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchRates()).rejects.toThrow('Network error');
  });
});
