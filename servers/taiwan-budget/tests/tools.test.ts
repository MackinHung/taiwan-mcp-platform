import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: {
    EXPENDITURE: 'A41000000G-000001',
    REVENUE: 'A41000000G-000002',
    AGENCY_SUMMARY: 'A41000000G-000003',
    FINAL_ACCOUNTS: 'A41000000G-000004',
    SPECIAL_BUDGET: 'A41000000G-000005',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { fetchDataset } from '../src/client.js';
import { getExpenditureBudget } from '../src/tools/expenditure.js';
import { getRevenueBudget } from '../src/tools/revenue.js';
import { getAgencyBudgetSummary } from '../src/tools/agency-summary.js';
import { getFinalAccounts } from '../src/tools/final-accounts.js';
import { searchBudget } from '../src/tools/budget-search.js';
import type { Env } from '../src/types.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  SERVER_NAME: 'taiwan-budget',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchDataset.mockReset();
});

// --- Expenditure Budget ---
describe('getExpenditureBudget', () => {
  const sampleData = {
    records: [
      {
        '年度': '113',
        '機關名稱': '教育部',
        '歲出科目名稱': '一般教育',
        '預算數': '280,000,000',
        '決算數': '275,000,000',
      },
    ],
    total: 1,
  };

  it('returns expenditure data for all agencies', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getExpenditureBudget(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('教育部');
    expect(result.content[0].text).toContain('280,000,000');
    expect(result.content[0].text).toContain('中央政府歲出預算');
  });

  it('passes agency filter to fetchDataset', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getExpenditureBudget(env, { agency: '教育部' });
    expect(mockFetchDataset).toHaveBeenCalledWith('A41000000G-000001', {
      limit: 30,
      filters: { '機關名稱': '教育部' },
    });
  });

  it('passes year filter to fetchDataset', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getExpenditureBudget(env, { year: '113' });
    expect(mockFetchDataset).toHaveBeenCalledWith('A41000000G-000001', {
      limit: 30,
      filters: { '年度': '113' },
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getExpenditureBudget(env, { agency: '不存在機關' });
    expect(result.content[0].text).toContain('查無符合條件的歲出預算資料');
    expect(result.content[0].text).toContain('不存在機關');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API down'));
    const result = await getExpenditureBudget(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Revenue Budget ---
describe('getRevenueBudget', () => {
  const sampleData = {
    records: [
      {
        '年度': '113',
        '科目名稱': '稅課收入',
        '預算數': '1,500,000,000',
        '決算數': '1,600,000,000',
        '比較增減': '100,000,000',
      },
    ],
    total: 1,
  };

  it('returns revenue data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getRevenueBudget(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('稅課收入');
    expect(result.content[0].text).toContain('1,500,000,000');
    expect(result.content[0].text).toContain('中央政府歲入預算');
  });

  it('passes year and category filters', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getRevenueBudget(env, { year: '113', category: '稅課收入' });
    expect(mockFetchDataset).toHaveBeenCalledWith('A41000000G-000002', {
      limit: 30,
      filters: { '年度': '113', '科目名稱': '稅課收入' },
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRevenueBudget(env, { year: '999' });
    expect(result.content[0].text).toContain('查無符合條件的歲入預算資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('timeout'));
    const result = await getRevenueBudget(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Agency Budget Summary ---
describe('getAgencyBudgetSummary', () => {
  const sampleData = {
    records: [
      {
        '機關名稱': '國防部',
        '預算數': '350,000,000',
        '人事費': '150,000,000',
        '業務費': '100,000,000',
      },
    ],
    total: 1,
  };

  it('returns agency summary data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getAgencyBudgetSummary(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('國防部');
    expect(result.content[0].text).toContain('350,000,000');
    expect(result.content[0].text).toContain('各機關預算彙總');
  });

  it('passes agency filter to fetchDataset', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getAgencyBudgetSummary(env, { agency: '國防部' });
    expect(mockFetchDataset).toHaveBeenCalledWith('A41000000G-000003', {
      limit: 30,
      filters: { '機關名稱': '國防部' },
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getAgencyBudgetSummary(env, { agency: '不存在' });
    expect(result.content[0].text).toContain('查無機關「不存在」的預算彙總資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('server error'));
    const result = await getAgencyBudgetSummary(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Final Accounts ---
describe('getFinalAccounts', () => {
  const sampleData = {
    records: [
      {
        '年度': '112',
        '機關名稱': '衛生福利部',
        '預算數': '200,000,000',
        '決算數': '195,000,000',
        '執行率': '97.5%',
      },
    ],
    total: 1,
  };

  it('returns final accounts data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getFinalAccounts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('衛生福利部');
    expect(result.content[0].text).toContain('97.5%');
    expect(result.content[0].text).toContain('中央政府決算');
  });

  it('passes agency and year filters', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getFinalAccounts(env, { agency: '衛生福利部', year: '112' });
    expect(mockFetchDataset).toHaveBeenCalledWith('A41000000G-000004', {
      limit: 30,
      filters: { '機關名稱': '衛生福利部', '年度': '112' },
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getFinalAccounts(env, { year: '999' });
    expect(result.content[0].text).toContain('查無符合條件的決算資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('db error'));
    const result = await getFinalAccounts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});

// --- Budget Search ---
describe('searchBudget', () => {
  const expenditureRecords = {
    records: [
      {
        '年度': '113',
        '機關名稱': '教育部',
        '歲出科目名稱': '一般教育',
        '預算數': '280,000,000',
        '決算數': '275,000,000',
      },
      {
        '年度': '113',
        '機關名稱': '國防部',
        '歲出科目名稱': '國防經費',
        '預算數': '350,000,000',
        '決算數': '340,000,000',
      },
    ],
    total: 2,
  };

  const revenueRecords = {
    records: [
      {
        '年度': '113',
        '科目名稱': '教育捐',
        '預算數': '50,000,000',
        '決算數': '48,000,000',
      },
    ],
    total: 1,
  };

  it('searches across expenditure and revenue datasets', async () => {
    mockFetchDataset
      .mockResolvedValueOnce(expenditureRecords)
      .mockResolvedValueOnce(revenueRecords);
    const result = await searchBudget(env, { keyword: '教育' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('教育部');
    expect(result.content[0].text).toContain('教育捐');
    expect(result.content[0].text).toContain('[歲出]');
    expect(result.content[0].text).toContain('[歲入]');
  });

  it('returns no results message when nothing matches', async () => {
    mockFetchDataset
      .mockResolvedValueOnce({ records: [], total: 0 })
      .mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchBudget(env, { keyword: '完全不存在的關鍵字' });
    expect(result.content[0].text).toContain('無符合結果');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchBudget(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchBudget(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles partial API failure gracefully', async () => {
    mockFetchDataset
      .mockResolvedValueOnce(expenditureRecords)
      .mockRejectedValueOnce(new Error('revenue API down'));
    const result = await searchBudget(env, { keyword: '教育' });
    // Should still show expenditure results even if revenue fails
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('教育部');
  });

  it('respects limit parameter', async () => {
    const manyRecords = {
      records: Array.from({ length: 50 }, (_, i) => ({
        '年度': '113',
        '機關名稱': `機關${i}`,
        '預算數': '1000',
      })),
      total: 50,
    };
    mockFetchDataset
      .mockResolvedValueOnce(manyRecords)
      .mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchBudget(env, { keyword: '機關', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset
      .mockRejectedValueOnce(new Error('total failure'))
      .mockRejectedValueOnce(new Error('total failure'));
    const result = await searchBudget(env, { keyword: '教育' });
    // Both failed via allSettled — should return no results
    expect(result.content[0].text).toContain('無符合結果');
  });
});
