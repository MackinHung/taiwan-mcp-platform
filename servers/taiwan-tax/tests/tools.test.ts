import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  FIA_CSV_URL: 'https://eip.fia.gov.tw/data/BGMOPEN1.csv',
  OPENDATA_BASE: 'https://data.gov.tw/api/v2/rest/datastore',
  parseCsvRows: vi.fn(),
  fetchBusinessTaxCsv: vi.fn(),
  fetchOpenData: vi.fn(),
}));

import { fetchBusinessTaxCsv, fetchOpenData } from '../src/client.js';
import { calculateIncomeTax } from '../src/tools/income-tax-calc.js';
import { lookupBusinessTax } from '../src/tools/business-tax-lookup.js';
import { getTaxBrackets } from '../src/tools/tax-brackets.js';
import { getTaxCalendar } from '../src/tools/tax-calendar.js';
import { getTaxStatistics } from '../src/tools/business-tax-stats.js';

const mockFetchBusiness = vi.mocked(fetchBusinessTaxCsv);
const mockFetchOpenData = vi.mocked(fetchOpenData);

const env: Env = { SERVER_NAME: 'taiwan-tax', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── calculateIncomeTax ─────────────────────────────

describe('calculateIncomeTax', () => {
  it('calculates tax for lowest bracket', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: 500000 });
    const text = result.content[0].text;
    expect(text).toContain('500,000');
    expect(text).toContain('5%');
    expect(text).toContain('25,000');
  });

  it('calculates tax for middle bracket', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: 1000000 });
    const text = result.content[0].text;
    expect(text).toContain('12%');
    expect(text).toContain('78,700');
  });

  it('calculates tax for highest bracket', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: 10000000 });
    const text = result.content[0].text;
    expect(text).toContain('40%');
  });

  it('applies deductions', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: 1000000, deductions: 500000 });
    const text = result.content[0].text;
    expect(text).toContain('500,000');
    expect(text).toContain('5%');
  });

  it('returns zero tax when deductions exceed income', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: 100000, deductions: 200000 });
    const text = result.content[0].text;
    expect(text).toContain('0 元');
    expect(text).toContain('0%');
  });

  it('returns error when annualIncome missing', async () => {
    const result = await calculateIncomeTax(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('annualIncome');
  });

  it('returns error when annualIncome is negative', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: -1000 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('非負數值');
  });

  it('shows effective tax rate', async () => {
    const result = await calculateIncomeTax(env, { annualIncome: 2000000 });
    const text = result.content[0].text;
    expect(text).toContain('有效稅率');
  });
});

// ─── lookupBusinessTax ──────────────────────────────

describe('lookupBusinessTax', () => {
  it('returns matching records', async () => {
    mockFetchBusiness.mockResolvedValueOnce([
      { 統一編號: '12345678', 營業人名稱: '台積電', 營業地址: '新竹市', 負責人姓名: '魏哲家', 資本額: '2593', 設立日期: '0760221', 營業狀態: '營業中', 組織別名稱: '股份有限公司' },
    ]);

    const result = await lookupBusinessTax(env, { keyword: '台積' });
    const text = result.content[0].text;
    expect(text).toContain('台積電');
    expect(text).toContain('12345678');
    expect(text).toContain('新竹市');
    expect(text).toContain('1 筆');
  });

  it('handles no results', async () => {
    mockFetchBusiness.mockResolvedValueOnce([]);

    const result = await lookupBusinessTax(env, { keyword: '不存在公司' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('limits results to 20', async () => {
    const records = Array.from({ length: 30 }, (_, i) => ({
      統一編號: `${10000000 + i}`,
      營業人名稱: `公司${i}`,
    }));
    mockFetchBusiness.mockResolvedValueOnce(records);

    const result = await lookupBusinessTax(env, { keyword: '公司' });
    const text = result.content[0].text;
    expect(text).toContain('前 20 筆');
    expect(text).toContain('共 30 筆');
  });

  it('returns error when keyword missing', async () => {
    const result = await lookupBusinessTax(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('keyword');
  });

  it('handles API error', async () => {
    mockFetchBusiness.mockRejectedValueOnce(new Error('network error'));

    const result = await lookupBusinessTax(env, { keyword: '台積' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network error');
  });
});

// ─── getTaxBrackets ─────────────────────────────────

describe('getTaxBrackets', () => {
  it('returns income tax brackets by default', async () => {
    const result = await getTaxBrackets(env, {});
    const text = result.content[0].text;
    expect(text).toContain('綜合所得稅');
    expect(text).toContain('5%');
    expect(text).toContain('12%');
    expect(text).toContain('20%');
    expect(text).toContain('30%');
    expect(text).toContain('40%');
  });

  it('returns income brackets when type=income', async () => {
    const result = await getTaxBrackets(env, { type: 'income' });
    expect(result.content[0].text).toContain('綜合所得稅');
  });

  it('returns business brackets when type=business', async () => {
    const result = await getTaxBrackets(env, { type: 'business' });
    const text = result.content[0].text;
    expect(text).toContain('營利事業所得稅');
    expect(text).toContain('20%');
    expect(text).toContain('120,000');
  });

  it('returns error for invalid type', async () => {
    const result = await getTaxBrackets(env, { type: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('income');
    expect(result.content[0].text).toContain('business');
  });
});

// ─── getTaxCalendar ─────────────────────────────────

describe('getTaxCalendar', () => {
  it('returns calendar for month with deadlines', async () => {
    const result = await getTaxCalendar(env, { month: 5 });
    const text = result.content[0].text;
    expect(text).toContain('5 月');
    expect(text).toContain('綜合所得稅');
    expect(text).toContain('營利事業所得稅');
  });

  it('returns calendar for month without deadlines', async () => {
    const result = await getTaxCalendar(env, { month: 2 });
    const text = result.content[0].text;
    expect(text).toContain('2 月');
    expect(text).toContain('無重大稅務申報期限');
  });

  it('shows upcoming deadlines', async () => {
    const result = await getTaxCalendar(env, { month: 1 });
    const text = result.content[0].text;
    expect(text).toContain('即將到來');
  });

  it('returns error for invalid month', async () => {
    const result = await getTaxCalendar(env, { month: 13 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1-12');
  });

  it('returns error for month 0', async () => {
    const result = await getTaxCalendar(env, { month: 0 });
    expect(result.isError).toBe(true);
  });
});

// ─── getTaxStatistics ───────────────────────────────

describe('getTaxStatistics', () => {
  it('returns statistics data', async () => {
    mockFetchOpenData.mockResolvedValueOnce({
      success: true,
      result: {
        records: [
          { 年度: '113', 稅目: '營業稅', 金額: '5000' },
          { 年度: '113', 稅目: '所得稅', 金額: '8000' },
        ],
        total: 2,
      },
    });

    const result = await getTaxStatistics(env, {});
    const text = result.content[0].text;
    expect(text).toContain('2 筆');
    expect(text).toContain('營業稅');
    expect(text).toContain('5000');
  });

  it('filters by year', async () => {
    mockFetchOpenData.mockResolvedValueOnce({
      success: true,
      result: {
        records: [{ 年度: '113', 稅目: '營業稅', 金額: '5000' }],
        total: 1,
      },
    });

    const result = await getTaxStatistics(env, { year: '113' });
    const text = result.content[0].text;
    expect(text).toContain('113');
  });

  it('filters by category', async () => {
    mockFetchOpenData.mockResolvedValueOnce({
      success: true,
      result: {
        records: [
          { 年度: '113', 稅目: '營業稅', 金額: '5000' },
          { 年度: '113', 稅目: '所得稅', 金額: '8000' },
        ],
        total: 2,
      },
    });

    const result = await getTaxStatistics(env, { category: '營業稅' });
    const text = result.content[0].text;
    expect(text).toContain('營業稅');
    expect(text).not.toContain('所得稅');
  });

  it('handles no matching records', async () => {
    mockFetchOpenData.mockResolvedValueOnce({
      success: true,
      result: { records: [], total: 0 },
    });

    const result = await getTaxStatistics(env, { year: '999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetchOpenData.mockRejectedValueOnce(new Error('timeout'));

    const result = await getTaxStatistics(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});
