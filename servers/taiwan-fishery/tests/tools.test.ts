import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, FisheryRecord } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  FISHERY_RESOURCE_ID: 'a8b5c7d2-3e1f-4f6a-9b0c-d2e3f4a5b6c7',
  buildUrl: vi.fn(),
  fetchFisheryData: vi.fn(),
}));

import { fetchFisheryData } from '../src/client.js';
import { getFisheryProduction } from '../src/tools/fishery-production.js';
import { searchFishingPorts } from '../src/tools/search-ports.js';
import { getSpeciesInfo } from '../src/tools/species-info.js';
import { getAquacultureStats } from '../src/tools/aquaculture-stats.js';
import { getFisheryTrends } from '../src/tools/fishery-trends.js';

const mockFetchFisheryData = vi.mocked(fetchFisheryData);

const env: Env = {
  SERVER_NAME: 'taiwan-fishery',
  SERVER_VERSION: '1.0.0',
};

function makeRecord(overrides: Partial<FisheryRecord> = {}): FisheryRecord {
  return {
    year: '2025',
    category: '遠洋漁業',
    speciesName: '鮪魚',
    production: 150000,
    value: 5000000,
    portName: '前鎮漁港',
    portAddress: '高雄市前鎮區漁港路1號',
    portCounty: '高雄市',
    aquacultureArea: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getFisheryProduction ──────────────────────────────

describe('getFisheryProduction', () => {
  it('returns grouped data when no category filter', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ category: '遠洋漁業', production: 100 }),
        makeRecord({ category: '養殖漁業', production: 200 }),
      ],
      total: 2,
    });

    const result = await getFisheryProduction(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('遠洋漁業');
    expect(result.content[0].text).toContain('養殖漁業');
    expect(result.content[0].text).toContain('依類別');
  });

  it('returns individual records when category filter is set', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [makeRecord({ category: '遠洋漁業', speciesName: '鮪魚' })],
      total: 1,
    });

    const result = await getFisheryProduction(env, { category: '遠洋漁業' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('鮪魚');
    expect(result.content[0].text).toContain('遠洋漁業');
  });

  it('filters by year', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2025', speciesName: '鮪魚' }),
        makeRecord({ year: '2024', speciesName: '鯖魚' }),
      ],
      total: 2,
    });

    const result = await getFisheryProduction(env, { category: '遠洋漁業', year: '2025' });
    expect(result.content[0].text).toContain('鮪魚');
    expect(result.content[0].text).toContain('2025');
  });

  it('returns not-found message when no data', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({ records: [], total: 0 });

    const result = await getFisheryProduction(env, { category: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetchFisheryData.mockRejectedValueOnce(new Error('API down'));

    const result = await getFisheryProduction(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('respects limit parameter', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [makeRecord()],
      total: 50,
    });

    const result = await getFisheryProduction(env, { category: '遠洋漁業', limit: 10 });
    expect(result.isError).toBeUndefined();
    expect(mockFetchFisheryData).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  it('clamps limit to max 100', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [makeRecord()],
      total: 1,
    });

    await getFisheryProduction(env, { category: '遠洋漁業', limit: 200 });
    expect(mockFetchFisheryData).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });
});

// ─── searchFishingPorts ──────────────────────────────

describe('searchFishingPorts', () => {
  it('returns matching ports by name', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ portName: '前鎮漁港', portCounty: '高雄市' }),
        makeRecord({ portName: '南方澳漁港', portCounty: '宜蘭縣' }),
      ],
      total: 2,
    });

    const result = await searchFishingPorts(env, { keyword: '前鎮' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('前鎮漁港');
    expect(result.content[0].text).not.toContain('南方澳');
  });

  it('returns matching ports by county', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ portName: '前鎮漁港', portCounty: '高雄市' }),
        makeRecord({ portName: '南方澳漁港', portCounty: '宜蘭縣' }),
      ],
      total: 2,
    });

    const result = await searchFishingPorts(env, { keyword: '宜蘭' });
    expect(result.content[0].text).toContain('南方澳漁港');
  });

  it('deduplicates ports by name', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ portName: '前鎮漁港', portCounty: '高雄市' }),
        makeRecord({ portName: '前鎮漁港', portCounty: '高雄市' }),
        makeRecord({ portName: '前鎮漁港', portCounty: '高雄市' }),
      ],
      total: 3,
    });

    const result = await searchFishingPorts(env, { keyword: '前鎮' });
    expect(result.content[0].text).toContain('共 1 座');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchFishingPorts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns not-found message when no match', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({ records: [], total: 0 });

    const result = await searchFishingPorts(env, { keyword: '不存在港' });
    expect(result.content[0].text).toContain('找不到');
    expect(result.content[0].text).toContain('不存在港');
  });

  it('handles API error', async () => {
    mockFetchFisheryData.mockRejectedValueOnce(new Error('timeout'));

    const result = await searchFishingPorts(env, { keyword: '前鎮' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });

  it('skips records with empty port name', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ portName: '', portCounty: '高雄市' }),
        makeRecord({ portName: '前鎮漁港', portCounty: '高雄市' }),
      ],
      total: 2,
    });

    const result = await searchFishingPorts(env, { keyword: '高雄' });
    expect(result.content[0].text).toContain('共 1 座');
  });
});

// ─── getSpeciesInfo ──────────────────────────────

describe('getSpeciesInfo', () => {
  it('returns species data across years', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2025', speciesName: '鮪魚', production: 150000, value: 5000000 }),
        makeRecord({ year: '2024', speciesName: '鮪魚', production: 145000, value: 4800000 }),
      ],
      total: 2,
    });

    const result = await getSpeciesInfo(env, { species: '鮪魚' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('鮪魚');
    expect(result.content[0].text).toContain('2025');
    expect(result.content[0].text).toContain('2024');
    expect(result.content[0].text).toContain('總產量');
  });

  it('returns error when species is missing', async () => {
    const result = await getSpeciesInfo(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供魚種名稱');
  });

  it('returns not-found message', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({ records: [], total: 0 });

    const result = await getSpeciesInfo(env, { species: '不存在魚' });
    expect(result.content[0].text).toContain('找不到');
    expect(result.content[0].text).toContain('不存在魚');
  });

  it('handles API error', async () => {
    mockFetchFisheryData.mockRejectedValueOnce(new Error('network'));

    const result = await getSpeciesInfo(env, { species: '鮪魚' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network');
  });

  it('shows categories and totals', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ speciesName: '鮪魚', category: '遠洋漁業', production: 100, value: 200 }),
        makeRecord({ speciesName: '鮪魚', category: '近海漁業', production: 50, value: 100 }),
      ],
      total: 2,
    });

    const result = await getSpeciesInfo(env, { species: '鮪魚' });
    expect(result.content[0].text).toContain('遠洋漁業');
    expect(result.content[0].text).toContain('近海漁業');
    expect(result.content[0].text).toContain('150');
    expect(result.content[0].text).toContain('300');
  });

  it('sorts by year descending', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2023', speciesName: '鮪魚' }),
        makeRecord({ year: '2025', speciesName: '鮪魚' }),
        makeRecord({ year: '2024', speciesName: '鮪魚' }),
      ],
      total: 3,
    });

    const result = await getSpeciesInfo(env, { species: '鮪魚' });
    const text = result.content[0].text;
    expect(text.indexOf('2025')).toBeLessThan(text.indexOf('2024'));
    expect(text.indexOf('2024')).toBeLessThan(text.indexOf('2023'));
  });
});

// ─── getAquacultureStats ──────────────────────────────

describe('getAquacultureStats', () => {
  it('returns aquaculture records', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ category: '養殖漁業', speciesName: '虱目魚', aquacultureArea: 12000, portCounty: '台南市' }),
      ],
      total: 1,
    });

    const result = await getAquacultureStats(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('虱目魚');
    expect(result.content[0].text).toContain('12,000');
    expect(result.content[0].text).toContain('台南市');
  });

  it('passes category=養殖漁業 to fetchFisheryData', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({ records: [], total: 0 });

    await getAquacultureStats(env, {});
    expect(mockFetchFisheryData).toHaveBeenCalledWith(
      expect.objectContaining({ category: '養殖漁業' })
    );
  });

  it('filters by county', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ portCounty: '台南市', speciesName: '虱目魚' }),
        makeRecord({ portCounty: '高雄市', speciesName: '石斑魚' }),
      ],
      total: 2,
    });

    const result = await getAquacultureStats(env, { county: '台南' });
    expect(result.content[0].text).toContain('虱目魚');
    expect(result.content[0].text).not.toContain('石斑魚');
  });

  it('returns not-found when no records', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({ records: [], total: 0 });

    const result = await getAquacultureStats(env, { county: '不存在縣' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetchFisheryData.mockRejectedValueOnce(new Error('fail'));

    const result = await getAquacultureStats(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fail');
  });

  it('shows aquaculture area', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [makeRecord({ aquacultureArea: 5000 })],
      total: 1,
    });

    const result = await getAquacultureStats(env, {});
    expect(result.content[0].text).toContain('5,000');
    expect(result.content[0].text).toContain('公頃');
  });
});

// ─── getFisheryTrends ──────────────────────────────

describe('getFisheryTrends', () => {
  it('groups by year and shows trends', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2024', production: 100, value: 500 }),
        makeRecord({ year: '2025', production: 120, value: 600 }),
      ],
      total: 2,
    });

    const result = await getFisheryTrends(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('2024');
    expect(result.content[0].text).toContain('2025');
    expect(result.content[0].text).toContain('趨勢分析');
  });

  it('filters by species name', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ speciesName: '鮪魚', year: '2025' }),
        makeRecord({ speciesName: '鯖魚', year: '2025' }),
      ],
      total: 2,
    });

    const result = await getFisheryTrends(env, { speciesName: '鮪魚' });
    expect(result.content[0].text).toContain('鮪魚');
  });

  it('filters by category', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [makeRecord({ category: '遠洋漁業', year: '2025' })],
      total: 1,
    });

    const result = await getFisheryTrends(env, { category: '遠洋漁業' });
    expect(mockFetchFisheryData).toHaveBeenCalledWith(
      expect.objectContaining({ category: '遠洋漁業' })
    );
  });

  it('returns not-found when no data', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({ records: [], total: 0 });

    const result = await getFisheryTrends(env, { speciesName: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetchFisheryData.mockRejectedValueOnce(new Error('down'));

    const result = await getFisheryTrends(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('down');
  });

  it('calculates year-over-year changes', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2024', production: 100, value: 500 }),
        makeRecord({ year: '2025', production: 120, value: 600 }),
      ],
      total: 2,
    });

    const result = await getFisheryTrends(env, {});
    expect(result.content[0].text).toContain('%');
  });

  it('sorts years in ascending order', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2025', production: 120 }),
        makeRecord({ year: '2023', production: 90 }),
        makeRecord({ year: '2024', production: 100 }),
      ],
      total: 3,
    });

    const result = await getFisheryTrends(env, {});
    const text = result.content[0].text;
    expect(text.indexOf('2023')).toBeLessThan(text.indexOf('2024'));
    expect(text.indexOf('2024')).toBeLessThan(text.indexOf('2025'));
  });

  it('aggregates multiple records in same year', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        makeRecord({ year: '2025', production: 100, value: 500 }),
        makeRecord({ year: '2025', production: 200, value: 800 }),
      ],
      total: 2,
    });

    const result = await getFisheryTrends(env, {});
    expect(result.content[0].text).toContain('300');
    expect(result.content[0].text).toContain('1,300');
  });
});
