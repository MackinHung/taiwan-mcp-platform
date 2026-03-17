import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  RESOURCE_IDS: {
    WAGE_STATISTICS: '6415',
  },
  buildUrl: vi.fn(),
  fetchOpenData: vi.fn(),
}));

import { fetchOpenData } from '../src/client.js';
import { getMinimumWage } from '../src/tools/minimum-wage.js';
import { getLaborInsuranceInfo } from '../src/tools/labor-insurance.js';
import { getPensionInfo } from '../src/tools/pension.js';
import { getWageStatistics } from '../src/tools/wage-stats.js';
import { getLaborLawInfo } from '../src/tools/labor-laws.js';
import type { Env } from '../src/types.js';

const mockFetchOpenData = vi.mocked(fetchOpenData);

const env: Env = {
  SERVER_NAME: 'taiwan-labor',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchOpenData.mockReset();
});

// --- Minimum Wage ---
describe('getMinimumWage', () => {
  it('returns current minimum wage info', async () => {
    const result = await getMinimumWage(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('28,590');
    expect(result.content[0].text).toContain('190');
  });

  it('includes effective date', async () => {
    const result = await getMinimumWage(env, {});
    expect(result.content[0].text).toContain('2025-01-01');
  });

  it('includes historical wage data', async () => {
    const result = await getMinimumWage(env, {});
    expect(result.content[0].text).toContain('27,470');
    expect(result.content[0].text).toContain('26,400');
  });

  it('includes data source attribution', async () => {
    const result = await getMinimumWage(env, {});
    expect(result.content[0].text).toContain('勞動部');
  });
});

// --- Labor Insurance ---
describe('getLaborInsuranceInfo', () => {
  it('returns rate table without salary', async () => {
    const result = await getLaborInsuranceInfo(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('12%');
    expect(result.content[0].text).toContain('70%');
    expect(result.content[0].text).toContain('20%');
    expect(result.content[0].text).toContain('10%');
  });

  it('calculates premium when salary provided', async () => {
    const result = await getLaborInsuranceInfo(env, { salary: 45800 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('45,800');
    expect(result.content[0].text).toContain('雇主負擔');
    expect(result.content[0].text).toContain('勞工負擔');
  });

  it('does not show premium section without salary', async () => {
    const result = await getLaborInsuranceInfo(env, {});
    expect(result.content[0].text).not.toContain('保費試算');
  });

  it('includes occupational accident insurance info', async () => {
    const result = await getLaborInsuranceInfo(env, {});
    expect(result.content[0].text).toContain('職業災害');
  });
});

// --- Pension ---
describe('getPensionInfo', () => {
  it('returns pension overview without inputs', async () => {
    const result = await getPensionInfo(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('6%');
    expect(result.content[0].text).toContain('個人退休金專戶');
  });

  it('calculates contribution when salary provided', async () => {
    const result = await getPensionInfo(env, { salary: 50000 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('3,000');
    expect(result.content[0].text).toContain('50,000');
  });

  it('estimates accumulation with salary and years', async () => {
    const result = await getPensionInfo(env, { salary: 50000, years: 10 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('10 年');
    expect(result.content[0].text).toContain('360,000');
  });

  it('does not show accumulation without years', async () => {
    const result = await getPensionInfo(env, { salary: 50000 });
    expect(result.content[0].text).not.toContain('年累積試算');
  });
});

// --- Wage Statistics ---
describe('getWageStatistics', () => {
  const sampleRecords = [
    { year: '2024', industry: '製造業', averageWage: '45000', medianWage: '38000' },
    { year: '2024', industry: '服務業', averageWage: '42000', medianWage: '36000' },
  ];

  it('returns wage data from API', async () => {
    mockFetchOpenData.mockResolvedValueOnce(sampleRecords);
    const result = await getWageStatistics(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('製造業');
    expect(result.content[0].text).toContain('45000');
  });

  it('passes industry filter to API', async () => {
    mockFetchOpenData.mockResolvedValueOnce([sampleRecords[0]]);
    const result = await getWageStatistics(env, { industry: '製造業' });
    expect(result.isError).toBeUndefined();
    expect(mockFetchOpenData).toHaveBeenCalledWith(
      '6415',
      expect.objectContaining({ 'filters[industry]': '製造業' })
    );
  });

  it('handles empty results gracefully', async () => {
    mockFetchOpenData.mockResolvedValueOnce([]);
    const result = await getWageStatistics(env, { industry: '不存在業' });
    expect(result.content[0].text).toContain('查無');
    expect(result.content[0].text).toContain('不存在業');
  });

  it('handles API error gracefully', async () => {
    mockFetchOpenData.mockRejectedValueOnce(new Error('API down'));
    const result = await getWageStatistics(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Labor Laws ---
describe('getLaborLawInfo', () => {
  it('returns overview when no topic specified', async () => {
    const result = await getLaborLawInfo(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('工時');
    expect(result.content[0].text).toContain('特休');
    expect(result.content[0].text).toContain('加班');
    expect(result.content[0].text).toContain('資遣');
  });

  it('filters by topic keyword', async () => {
    const result = await getLaborLawInfo(env, { topic: '加班' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('加班費');
    expect(result.content[0].text).toContain('1/3');
  });

  it('returns annual leave info for 特休 topic', async () => {
    const result = await getLaborLawInfo(env, { topic: '特休' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('7 天');
    expect(result.content[0].text).toContain('14 天');
    expect(result.content[0].text).toContain('30 天');
  });

  it('returns overview for unknown topic', async () => {
    const result = await getLaborLawInfo(env, { topic: '完全無關' });
    expect(result.isError).toBeUndefined();
    // Falls back to showing all provisions
    expect(result.content[0].text).toContain('工時');
    expect(result.content[0].text).toContain('資遣');
  });
});
