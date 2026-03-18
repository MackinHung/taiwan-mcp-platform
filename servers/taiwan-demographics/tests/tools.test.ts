import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASET_POPULATION: 'ODRP010',
  DATASET_AGE_DISTRIBUTION: 'ODRP049',
  DATASET_VITAL_STATS: 'ODRP024',
  getDefaultYyyymm: vi.fn(() => '202603'),
  buildUrl: vi.fn(),
  fetchPopulation: vi.fn(),
  fetchAgeDistribution: vi.fn(),
  fetchVitalStats: vi.fn(),
}));

import { fetchPopulation, fetchAgeDistribution, fetchVitalStats } from '../src/client.js';
import { getPopulation } from '../src/tools/population.js';
import { getAgeDistribution } from '../src/tools/age-distribution.js';
import { getVitalStats } from '../src/tools/vital-stats.js';
import { getHouseholdStats } from '../src/tools/household-stats.js';
import { compareRegions } from '../src/tools/compare-regions.js';
import type { Env } from '../src/types.js';

const mockFetchPopulation = vi.mocked(fetchPopulation);
const mockFetchAgeDistribution = vi.mocked(fetchAgeDistribution);
const mockFetchVitalStats = vi.mocked(fetchVitalStats);

const env: Env = {
  SERVER_NAME: 'taiwan-demographics',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchPopulation.mockReset();
  mockFetchAgeDistribution.mockReset();
  mockFetchVitalStats.mockReset();
});

const samplePopulation = [
  { county: '臺北市', town: '中正區', population_total: '100000', population_male: '48000', population_female: '52000', household: '40000' },
  { county: '臺北市', town: '大安區', population_total: '120000', population_male: '58000', population_female: '62000', household: '50000' },
];

const sampleAgeData = [
  { age: '5', population_male: '1000', population_female: '950' },
  { age: '30', population_male: '5000', population_female: '5200' },
  { age: '70', population_male: '2000', population_female: '2500' },
];

const sampleVitalData = [
  { county: '臺北市', birth_total: '200', death_total: '300', marry_pair: '100', divorce_pair: '30' },
  { county: '新北市', birth_total: '400', death_total: '350', marry_pair: '200', divorce_pair: '60' },
];

// --- Get Population ---
describe('getPopulation', () => {
  it('returns population data for all counties', async () => {
    mockFetchPopulation.mockResolvedValueOnce(samplePopulation);
    const result = await getPopulation(env, { month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('人口');
  });

  it('returns population data for specific county', async () => {
    mockFetchPopulation.mockResolvedValueOnce(samplePopulation);
    const result = await getPopulation(env, { county: '臺北市', month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty results', async () => {
    mockFetchPopulation.mockResolvedValueOnce([]);
    const result = await getPopulation(env, { month: '202603' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid month format', async () => {
    const result = await getPopulation(env, { month: '2026-03' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYYMM');
  });

  it('handles API error gracefully', async () => {
    mockFetchPopulation.mockRejectedValueOnce(new Error('API down'));
    const result = await getPopulation(env, { month: '202603' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('uses default month when not provided', async () => {
    mockFetchPopulation.mockResolvedValueOnce(samplePopulation);
    const result = await getPopulation(env, {});
    expect(result.isError).toBeUndefined();
    expect(mockFetchPopulation).toHaveBeenCalledWith('202603', undefined);
  });
});

// --- Get Age Distribution ---
describe('getAgeDistribution', () => {
  it('returns age group breakdown', async () => {
    mockFetchAgeDistribution.mockResolvedValueOnce(sampleAgeData);
    const result = await getAgeDistribution(env, { month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('0-14 歲');
    expect(result.content[0].text).toContain('15-64 歲');
    expect(result.content[0].text).toContain('65 歲以上');
  });

  it('returns age distribution for specific county', async () => {
    mockFetchAgeDistribution.mockResolvedValueOnce(sampleAgeData);
    const result = await getAgeDistribution(env, { county: '臺北市', month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty results', async () => {
    mockFetchAgeDistribution.mockResolvedValueOnce([]);
    const result = await getAgeDistribution(env, { month: '202603' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid month format', async () => {
    const result = await getAgeDistribution(env, { month: 'abc' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYYMM');
  });

  it('handles API error gracefully', async () => {
    mockFetchAgeDistribution.mockRejectedValueOnce(new Error('timeout'));
    const result = await getAgeDistribution(env, { month: '202603' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });

  it('calculates percentage correctly', async () => {
    mockFetchAgeDistribution.mockResolvedValueOnce(sampleAgeData);
    const result = await getAgeDistribution(env, { month: '202603' });
    expect(result.content[0].text).toContain('%');
  });
});

// --- Get Vital Stats ---
describe('getVitalStats', () => {
  it('returns vital statistics', async () => {
    mockFetchVitalStats.mockResolvedValueOnce(sampleVitalData);
    const result = await getVitalStats(env, { month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('出生');
    expect(result.content[0].text).toContain('死亡');
    expect(result.content[0].text).toContain('結婚');
    expect(result.content[0].text).toContain('離婚');
  });

  it('returns vital stats for specific county', async () => {
    mockFetchVitalStats.mockResolvedValueOnce([sampleVitalData[0]]);
    const result = await getVitalStats(env, { county: '臺北市', month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty results', async () => {
    mockFetchVitalStats.mockResolvedValueOnce([]);
    const result = await getVitalStats(env, { month: '202603' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid month format', async () => {
    const result = await getVitalStats(env, { month: '20260' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYYMM');
  });

  it('handles API error gracefully', async () => {
    mockFetchVitalStats.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getVitalStats(env, { month: '202603' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('calculates natural growth', async () => {
    mockFetchVitalStats.mockResolvedValueOnce(sampleVitalData);
    const result = await getVitalStats(env, { month: '202603' });
    expect(result.content[0].text).toContain('自然增減');
  });
});

// --- Get Household Stats ---
describe('getHouseholdStats', () => {
  it('returns household statistics', async () => {
    mockFetchPopulation.mockResolvedValueOnce(samplePopulation);
    const result = await getHouseholdStats(env, { month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('戶數');
    expect(result.content[0].text).toContain('每戶平均');
  });

  it('returns household stats for specific county', async () => {
    mockFetchPopulation.mockResolvedValueOnce(samplePopulation);
    const result = await getHouseholdStats(env, { county: '臺北市', month: '202603' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty results', async () => {
    mockFetchPopulation.mockResolvedValueOnce([]);
    const result = await getHouseholdStats(env, { month: '202603' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid month format', async () => {
    const result = await getHouseholdStats(env, { month: '2026' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYYMM');
  });

  it('handles API error gracefully', async () => {
    mockFetchPopulation.mockRejectedValueOnce(new Error('server error'));
    const result = await getHouseholdStats(env, { month: '202603' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Compare Regions ---
describe('compareRegions', () => {
  it('compares two counties', async () => {
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '臺北市', population_total: '2600000', population_male: '1250000', population_female: '1350000', household: '1050000' },
    ]);
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '新北市', population_total: '4000000', population_male: '1950000', population_female: '2050000', household: '1600000' },
    ]);

    const result = await compareRegions(env, {
      counties: ['臺北市', '新北市'],
      month: '202603',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('新北市');
    expect(result.content[0].text).toContain('比較');
  });

  it('requires at least 2 counties', async () => {
    const result = await compareRegions(env, {
      counties: ['臺北市'],
      month: '202603',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少 2 個');
  });

  it('returns error when counties is missing', async () => {
    const result = await compareRegions(env, { month: '202603' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少 2 個');
  });

  it('returns error when counties is empty', async () => {
    const result = await compareRegions(env, { counties: [], month: '202603' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少 2 個');
  });

  it('returns error for invalid month format', async () => {
    const result = await compareRegions(env, {
      counties: ['臺北市', '新北市'],
      month: 'invalid',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYYMM');
  });

  it('handles partial API failure', async () => {
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '臺北市', population_total: '2600000', population_male: '1250000', population_female: '1350000', household: '1050000' },
    ]);
    mockFetchPopulation.mockRejectedValueOnce(new Error('API error'));

    const result = await compareRegions(env, {
      counties: ['臺北市', '新北市'],
      month: '202603',
    });
    // Should still succeed with partial data
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles all API failures', async () => {
    mockFetchPopulation.mockRejectedValueOnce(new Error('fail'));
    mockFetchPopulation.mockRejectedValueOnce(new Error('fail'));

    const result = await compareRegions(env, {
      counties: ['臺北市', '新北市'],
      month: '202603',
    });
    expect(result.content[0].text).toContain('查無');
  });

  it('compares three counties', async () => {
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '臺北市', population_total: '2600000', population_male: '1250000', population_female: '1350000', household: '1050000' },
    ]);
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '新北市', population_total: '4000000', population_male: '1950000', population_female: '2050000', household: '1600000' },
    ]);
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '桃園市', population_total: '2300000', population_male: '1150000', population_female: '1150000', household: '900000' },
    ]);

    const result = await compareRegions(env, {
      counties: ['臺北市', '新北市', '桃園市'],
      month: '202603',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('桃園市');
  });
});
