import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  FIRE_RESOURCE_ID: 'test-resource-id',
  buildUrl: vi.fn(),
  normalizeRecord: vi.fn(),
  fetchFireData: vi.fn(),
}));

import { fetchFireData } from '../src/client.js';
import { getRecentFires } from '../src/tools/recent-fires.js';
import { getFireStats } from '../src/tools/fire-stats.js';
import { getCasualtyReport } from '../src/tools/casualty-report.js';
import { searchByCause } from '../src/tools/search-by-cause.js';
import { getFireTrends } from '../src/tools/fire-trends.js';
import type { Env } from '../src/types.js';

const mockFetchFireData = vi.mocked(fetchFireData);

const env: Env = {
  SERVER_NAME: 'taiwan-fire-incident',
  SERVER_VERSION: '1.0.0',
};

const sampleFires = [
  {
    occurDate: '2026-03-15',
    occurTime: '14:30',
    county: '\u53F0\u5317\u5E02',
    district: '\u5927\u5B89\u5340',
    fireType: '\u5EFA\u7BC9\u7269\u706B\u707D',
    cause: '\u96FB\u6C23\u56E0\u7D20',
    deathCount: 0,
    injuryCount: 2,
    burnArea: 50,
    propertyLoss: 500000,
  },
  {
    occurDate: '2026-03-10',
    occurTime: '03:15',
    county: '\u9AD8\u96C4\u5E02',
    district: '\u4E09\u6C11\u5340',
    fireType: '\u5EFA\u7BC9\u7269\u706B\u707D',
    cause: '\u70F9\u98EA\u4E0D\u614E',
    deathCount: 1,
    injuryCount: 3,
    burnArea: 120,
    propertyLoss: 2000000,
  },
  {
    occurDate: '2026-02-28',
    occurTime: '22:45',
    county: '\u53F0\u5317\u5E02',
    district: '\u4FE1\u7FA9\u5340',
    fireType: '\u8ECA\u8F1B\u706B\u707D',
    cause: '\u96FB\u6C23\u56E0\u7D20',
    deathCount: 0,
    injuryCount: 0,
    burnArea: 5,
    propertyLoss: 300000,
  },
];

beforeEach(() => {
  mockFetchFireData.mockReset();
});

// --- get_recent_fires ---
describe('getRecentFires', () => {
  it('returns recent fire incidents', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getRecentFires(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u53F0\u5317\u5E02');
    expect(result.content[0].text).toContain('2026-03-15');
    expect(result.content[0].text).toContain('\u96FB\u6C23\u56E0\u7D20');
  });

  it('filters by county', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [sampleFires[0]], total: 1 });
    const result = await getRecentFires(env, { county: '\u53F0\u5317\u5E02' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u53F0\u5317\u5E02');
  });

  it('returns no-data message when empty', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRecentFires(env, {});
    expect(result.content[0].text).toContain('\u76EE\u524D\u7121\u706B\u707D\u6848\u4EF6\u8CC7\u6599');
  });

  it('respects limit parameter', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getRecentFires(env, { limit: 1 });
    expect(result.content[0].text).toContain('\u986F\u793A 1 \u7B46');
  });

  it('shows casualty info', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getRecentFires(env, {});
    expect(result.content[0].text).toContain('\u6B7B\u4EA1');
    expect(result.content[0].text).toContain('\u53D7\u50B7');
  });

  it('handles API error gracefully', async () => {
    mockFetchFireData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await getRecentFires(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('shows property loss', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getRecentFires(env, {});
    expect(result.content[0].text).toContain('\u8CA1\u640D');
  });
});

// --- get_fire_stats ---
describe('getFireStats', () => {
  it('groups by county by default', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireStats(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u7E23\u5E02');
    expect(result.content[0].text).toContain('\u53F0\u5317\u5E02');
    expect(result.content[0].text).toContain('\u9AD8\u96C4\u5E02');
  });

  it('groups by month', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireStats(env, { groupBy: 'month' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u6708\u4EFD');
    expect(result.content[0].text).toContain('2026-03');
    expect(result.content[0].text).toContain('2026-02');
  });

  it('returns error for invalid groupBy', async () => {
    const result = await getFireStats(env, { groupBy: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('groupBy');
  });

  it('returns no-data message when empty', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getFireStats(env, {});
    expect(result.content[0].text).toContain('\u76EE\u524D\u7121\u706B\u707D\u7D71\u8A08\u8CC7\u6599');
  });

  it('includes death and injury counts', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireStats(env, {});
    expect(result.content[0].text).toContain('\u6B7B\u4EA1\u4EBA\u6578');
    expect(result.content[0].text).toContain('\u53D7\u50B7\u4EBA\u6578');
  });

  it('includes property loss', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireStats(env, {});
    expect(result.content[0].text).toContain('\u8CA1\u7269\u640D\u5931');
  });

  it('handles API error gracefully', async () => {
    mockFetchFireData.mockRejectedValueOnce(new Error('server down'));
    const result = await getFireStats(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });

  it('filters by county', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [sampleFires[0]], total: 1 });
    const result = await getFireStats(env, { county: '\u53F0\u5317\u5E02' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u53F0\u5317\u5E02');
  });
});

// --- get_casualty_report ---
describe('getCasualtyReport', () => {
  it('returns casualty summary with totals', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getCasualtyReport(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u7E3D\u6B7B\u4EA1\u4EBA\u6578: 1');
    expect(result.content[0].text).toContain('\u7E3D\u53D7\u50B7\u4EBA\u6578: 5');
  });

  it('lists incidents with casualties', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getCasualtyReport(env, {});
    // Sample has 2 incidents with casualties (fires[0] has injuries, fires[1] has deaths+injuries)
    expect(result.content[0].text).toContain('\u6709\u50B7\u4EA1\u6848\u4EF6\u6578: 2');
  });

  it('shows no-casualty message when no casualties exist', async () => {
    const noCasualtyFires = [{ ...sampleFires[2] }]; // 0 deaths, 0 injuries
    mockFetchFireData.mockResolvedValueOnce({ records: noCasualtyFires, total: 1 });
    const result = await getCasualtyReport(env, {});
    expect(result.content[0].text).toContain('\u76EE\u524D\u7121\u50B7\u4EA1\u6848\u4EF6');
  });

  it('returns no-data message when empty', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getCasualtyReport(env, {});
    expect(result.content[0].text).toContain('\u76EE\u524D\u7121\u706B\u707D\u50B7\u4EA1\u8CC7\u6599');
  });

  it('filters by county', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [sampleFires[0]], total: 1 });
    const result = await getCasualtyReport(env, { county: '\u53F0\u5317\u5E02' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u53F0\u5317\u5E02');
  });

  it('handles API error gracefully', async () => {
    mockFetchFireData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getCasualtyReport(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

// --- search_by_cause ---
describe('searchByCause', () => {
  it('returns matching fires by cause keyword', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await searchByCause(env, { cause: '\u96FB\u6C23\u56E0\u7D20' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u96FB\u6C23\u56E0\u7D20');
    expect(result.content[0].text).toContain('\u5171 2 \u7B46');
  });

  it('returns no-results when nothing matches', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await searchByCause(env, { cause: '\u4E0D\u5B58\u5728\u539F\u56E0XYZ' });
    expect(result.content[0].text).toContain('\u67E5\u7121\u8D77\u706B\u539F\u56E0\u542B');
  });

  it('returns error when cause is empty', async () => {
    const result = await searchByCause(env, { cause: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('\u8ACB\u63D0\u4F9B\u8D77\u706B\u539F\u56E0\u95DC\u9375\u5B57');
  });

  it('returns error when cause is missing', async () => {
    const result = await searchByCause(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('\u8ACB\u63D0\u4F9B\u8D77\u706B\u539F\u56E0\u95DC\u9375\u5B57');
  });

  it('respects limit parameter', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await searchByCause(env, { cause: '\u96FB\u6C23\u56E0\u7D20', limit: 1 });
    expect(result.content[0].text).toContain('\u986F\u793A 1 \u7B46');
  });

  it('handles API error gracefully', async () => {
    mockFetchFireData.mockRejectedValueOnce(new Error('rate limited'));
    const result = await searchByCause(env, { cause: '\u6E2C\u8A66' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });

  it('shows property loss in results', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await searchByCause(env, { cause: '\u70F9\u98EA' });
    expect(result.content[0].text).toContain('\u8CA1\u640D');
  });
});

// --- get_fire_trends ---
describe('getFireTrends', () => {
  it('returns monthly trend analysis', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireTrends(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u706B\u707D\u8DA8\u52E2\u5206\u6790');
    expect(result.content[0].text).toContain('2026-03');
    expect(result.content[0].text).toContain('2026-02');
  });

  it('shows trend direction', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireTrends(env, {});
    expect(result.content[0].text).toContain('\u8DA8\u52E2\u65B9\u5411');
  });

  it('returns no-data message when empty', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getFireTrends(env, {});
    expect(result.content[0].text).toContain('\u76EE\u524D\u7121\u706B\u707D\u8DA8\u52E2\u8CC7\u6599');
  });

  it('filters by county', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: [sampleFires[0]], total: 1 });
    const result = await getFireTrends(env, { county: '\u53F0\u5317\u5E02' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('\u53F0\u5317\u5E02');
  });

  it('handles API error gracefully', async () => {
    mockFetchFireData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getFireTrends(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });

  it('shows deaths and injuries per month', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleFires, total: 3 });
    const result = await getFireTrends(env, {});
    expect(result.content[0].text).toContain('\u6B7B\u4EA1');
    expect(result.content[0].text).toContain('\u53D7\u50B7');
  });

  it('detects upward trend when later months have more fires', async () => {
    const trendFires = [
      { ...sampleFires[2], occurDate: '2026-01-15' }, // Jan: 1 fire
      { ...sampleFires[0], occurDate: '2026-03-15' }, // Mar: 3 fires
      { ...sampleFires[0], occurDate: '2026-03-16' },
      { ...sampleFires[0], occurDate: '2026-03-17' },
    ];
    mockFetchFireData.mockResolvedValueOnce({ records: trendFires, total: 4 });
    const result = await getFireTrends(env, {});
    expect(result.content[0].text).toContain('\u4E0A\u5347');
  });
});
