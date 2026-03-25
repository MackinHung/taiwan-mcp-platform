import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: {
    NTPC_REALESTATE: 'acce802d-58cc-4dff-9e7a-9ecc517f78be',
  },
  buildUrl: vi.fn(),
  fetchTransactions: vi.fn(),
  parseRocDate: vi.fn((d: string | undefined) => {
    if (!d) return '未知日期';
    const cleaned = d.replace(/\//g, '').trim();
    if (cleaned.length === 7) {
      const year = parseInt(cleaned.substring(0, 3), 10) + 1911;
      const month = cleaned.substring(3, 5);
      const day = cleaned.substring(5, 7);
      return `${year}/${month}/${day}`;
    }
    return d;
  }),
  parseRocDateToPeriod: vi.fn((d: string | undefined) => {
    if (!d) return null;
    const cleaned = d.replace(/\//g, '').trim();
    if (cleaned.length === 7) {
      const year = parseInt(cleaned.substring(0, 3), 10) + 1911;
      const month = cleaned.substring(3, 5);
      return `${year}${month}`;
    }
    return null;
  }),
  westernToRocPrefix: vi.fn((yyyymm: string) => {
    if (yyyymm.length < 4) return yyyymm;
    const year = parseInt(yyyymm.substring(0, 4), 10) - 1911;
    const rest = yyyymm.substring(4);
    return `${year}${rest}`;
  }),
  safeParseNumber: vi.fn((v: string | undefined) => {
    if (!v) return 0;
    const num = parseFloat(v.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }),
  sqmToPing: vi.fn((sqm: number) => Math.round((sqm / 3.30579) * 100) / 100),
}));

import { fetchTransactions } from '../src/client.js';
import { searchTransactionsByArea } from '../src/tools/search-by-area.js';
import { searchTransactionsByDate } from '../src/tools/search-by-date.js';
import { getAreaPriceStatistics } from '../src/tools/price-statistics.js';
import { getRecentTransactions } from '../src/tools/recent-transactions.js';
import { getPriceTrend } from '../src/tools/price-trend.js';
import type { Env } from '../src/types.js';

const mockFetchTransactions = vi.mocked(fetchTransactions);

const env: Env = {
  SERVER_NAME: 'taiwan-realestate',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchTransactions.mockReset();
});

// --- Sample data ---
const sampleRecords = [
  {
    district: '中和區',
    address: '新北市中和區景平路100號',
    transaction_date: '1140115',
    total_price: '12000000',
    unit_price: '250000',
    building_area: '45.5',
    building_type: '住宅大樓(11層含以上有電梯)',
    rooms: '3',
    halls: '2',
    bathrooms: '1',
    total_floor: '15',
    main_use: '住家用',
    note: '',
  },
  {
    district: '板橋區',
    address: '新北市板橋區文化路200號',
    transaction_date: '1140201',
    total_price: '18000000',
    unit_price: '320000',
    building_area: '55.2',
    building_type: '公寓(5樓含以下無電梯)',
    rooms: '2',
    halls: '1',
    bathrooms: '1',
    total_floor: '5',
    main_use: '住家用',
    note: '含車位',
  },
  {
    district: '中和區',
    address: '新北市中和區中山路50號',
    transaction_date: '1140301',
    total_price: '8500000',
    unit_price: '200000',
    building_area: '38.0',
    building_type: '公寓(5樓含以下無電梯)',
    rooms: '2',
    halls: '1',
    bathrooms: '1',
    total_floor: '5',
    main_use: '住家用',
    note: '',
  },
];

// ==============================
// search_transactions_by_area
// ==============================
describe('searchTransactionsByArea', () => {
  it('returns transactions for specific district', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByArea(env, { district: '中和區' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中和區');
    expect(result.content[0].text).toContain('景平路');
    expect(result.content[0].text).not.toContain('板橋區');
  });

  it('returns all transactions when no district specified', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByArea(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('新北市不動產成交資料');
  });

  it('handles empty results', async () => {
    mockFetchTransactions.mockResolvedValueOnce([]);
    const result = await searchTransactionsByArea(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('handles district not found', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByArea(env, { district: '不存在區' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchTransactions.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchTransactionsByArea(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('respects limit parameter', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByArea(env, { limit: 1 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('顯示 1 筆');
  });
});

// ==============================
// search_transactions_by_date
// ==============================
describe('searchTransactionsByDate', () => {
  it('returns transactions within date range', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByDate(env, {
      start_date: '202501',
      end_date: '202502',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('202501 ~ 202502');
  });

  it('returns error when start_date is missing', async () => {
    const result = await searchTransactionsByDate(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('起始日期');
  });

  it('handles empty results for date range', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByDate(env, {
      start_date: '200001',
      end_date: '200012',
    });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchTransactions.mockRejectedValueOnce(new Error('server down'));
    const result = await searchTransactionsByDate(env, { start_date: '202501' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });

  it('filters by price range', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await searchTransactionsByDate(env, {
      start_date: '202501',
      min_price: 10000000,
      max_price: 20000000,
    });
    expect(result.isError).toBeUndefined();
    // Should include 12000000 and 18000000, exclude 8500000
  });

  it('handles empty API response', async () => {
    mockFetchTransactions.mockResolvedValueOnce([]);
    const result = await searchTransactionsByDate(env, { start_date: '202501' });
    expect(result.content[0].text).toContain('查無');
  });
});

// ==============================
// get_area_price_statistics
// ==============================
describe('getAreaPriceStatistics', () => {
  it('returns statistics for specific district', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getAreaPriceStatistics(env, { district: '中和區' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中和區');
    expect(result.content[0].text).toContain('交易筆數');
    expect(result.content[0].text).toContain('平均單價');
    expect(result.content[0].text).toContain('中位數');
  });

  it('returns statistics for all areas', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getAreaPriceStatistics(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('新北市');
    expect(result.content[0].text).toContain('3 筆');
  });

  it('handles empty results', async () => {
    mockFetchTransactions.mockResolvedValueOnce([]);
    const result = await getAreaPriceStatistics(env, { district: '中和區' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles district with no valid prices', async () => {
    mockFetchTransactions.mockResolvedValueOnce([
      { district: '中和區', unit_price: '0', total_price: '0' },
    ]);
    const result = await getAreaPriceStatistics(env, { district: '中和區' });
    expect(result.content[0].text).toContain('查無有效');
  });

  it('handles API error gracefully', async () => {
    mockFetchTransactions.mockRejectedValueOnce(new Error('timeout'));
    const result = await getAreaPriceStatistics(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });

  it('filters by property type', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getAreaPriceStatistics(env, { property_type: '住家' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('住家');
  });
});

// ==============================
// get_recent_transactions
// ==============================
describe('getRecentTransactions', () => {
  it('returns recent transactions sorted by date', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getRecentTransactions(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('最新成交案件');
    // Most recent should appear first (1140301)
    const text = result.content[0].text;
    const idx1 = text.indexOf('中山路');
    const idx2 = text.indexOf('文化路');
    // 1140301 is most recent, should appear before 1140201
    expect(idx1).toBeLessThan(idx2);
  });

  it('filters by district', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getRecentTransactions(env, { district: '板橋區' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('板橋區');
    expect(result.content[0].text).not.toContain('中和區');
  });

  it('handles empty results', async () => {
    mockFetchTransactions.mockResolvedValueOnce([]);
    const result = await getRecentTransactions(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('handles district not found', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getRecentTransactions(env, { district: '不存在區' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchTransactions.mockRejectedValueOnce(new Error('network fail'));
    const result = await getRecentTransactions(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network fail');
  });

  it('respects limit parameter', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getRecentTransactions(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示最新 1 筆');
  });
});

// ==============================
// get_price_trend
// ==============================
describe('getPriceTrend', () => {
  it('returns monthly trend data', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getPriceTrend(env, { period: 'monthly' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('趨勢');
    expect(result.content[0].text).toContain('平均單價');
    expect(result.content[0].text).toContain('成交筆數');
  });

  it('returns quarterly trend data', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getPriceTrend(env, { period: 'quarterly' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('季');
  });

  it('handles empty results', async () => {
    mockFetchTransactions.mockResolvedValueOnce([]);
    const result = await getPriceTrend(env, {});
    expect(result.content[0].text).toContain('查無');
  });

  it('handles district with no data', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getPriceTrend(env, { district: '不存在區' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchTransactions.mockRejectedValueOnce(new Error('API down'));
    const result = await getPriceTrend(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('shows overall change percentage', async () => {
    mockFetchTransactions.mockResolvedValueOnce(sampleRecords);
    const result = await getPriceTrend(env, { period: 'monthly' });
    expect(result.content[0].text).toContain('整體變化');
  });

  it('handles records with no valid unit prices', async () => {
    mockFetchTransactions.mockResolvedValueOnce([
      { district: '中和區', transaction_date: '1140115', unit_price: '0' },
    ]);
    const result = await getPriceTrend(env, {});
    expect(result.content[0].text).toContain('資料不足');
  });
});
