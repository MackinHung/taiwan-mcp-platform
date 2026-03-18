import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  UNIVERSITY_URL: 'https://stats.moe.gov.tw/files/opendata/u1_new.json',
  JUNIOR_HIGH_URL: 'https://stats.moe.gov.tw/files/opendata/j1_new.json',
  HIGH_SCHOOL_URL: 'https://stats.moe.gov.tw/files/school/114/high.json',
  fetchUniversities: vi.fn(),
  fetchJuniorHighSchools: vi.fn(),
  fetchHighSchools: vi.fn(),
  fetchAllSchools: vi.fn(),
}));

import { fetchUniversities, fetchJuniorHighSchools, fetchHighSchools, fetchAllSchools } from '../src/client.js';
import { searchUniversities } from '../src/tools/search-universities.js';
import { searchSchools } from '../src/tools/search-schools.js';
import { getSchoolDetails } from '../src/tools/school-details.js';
import { getEducationStats } from '../src/tools/education-stats.js';
import { searchByLocation } from '../src/tools/search-by-location.js';
import type { Env } from '../src/types.js';

const mockFetchUniversities = vi.mocked(fetchUniversities);
const mockFetchJuniorHighSchools = vi.mocked(fetchJuniorHighSchools);
const mockFetchHighSchools = vi.mocked(fetchHighSchools);
const mockFetchAllSchools = vi.mocked(fetchAllSchools);

const env: Env = {
  SERVER_NAME: 'taiwan-education',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchUniversities.mockReset();
  mockFetchJuniorHighSchools.mockReset();
  mockFetchHighSchools.mockReset();
  mockFetchAllSchools.mockReset();
});

const sampleUniversities = [
  { name: '國立臺灣大學', code: '0003', level: '大專校院', publicPrivate: '公立', city: '臺北市', address: '臺北市大安區羅斯福路四段1號', phone: '(02)33669999', website: 'https://www.ntu.edu.tw' },
  { name: '私立淡江大學', code: '1001', level: '大專校院', publicPrivate: '私立', city: '新北市', address: '新北市淡水區英專路151號', phone: '(02)26215656', website: 'https://www.tku.edu.tw' },
];

const sampleJuniorHighs = [
  { name: '市立敦化國中', code: '353501', level: '國民中學', publicPrivate: '公立', city: '臺北市', address: '臺北市松山區南京東路三段300號', phone: '(02)27115592', website: 'http://www.thjh.tp.edu.tw' },
];

const sampleHighSchools = [
  { name: '國立華僑高級中等學校', code: '10301', level: '高級中等學校', publicPrivate: '公立', city: '新北市', address: '新北市板橋區大觀路一段32號', phone: '(02)29684131', website: 'http://www.nocsh.ntpc.edu.tw' },
];

const allSchools = [...sampleUniversities, ...sampleJuniorHighs, ...sampleHighSchools];

// --- searchUniversities ---
describe('searchUniversities', () => {
  it('returns university results for keyword search', async () => {
    mockFetchUniversities.mockResolvedValueOnce(sampleUniversities);
    const result = await searchUniversities(env, { keyword: '臺灣' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大專校院');
    expect(result.content[0].text).toContain('國立臺灣大學');
  });

  it('returns university results for city search', async () => {
    mockFetchUniversities.mockResolvedValueOnce([sampleUniversities[1]]);
    const result = await searchUniversities(env, { city: '新北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('私立淡江大學');
  });

  it('returns university results for type search', async () => {
    mockFetchUniversities.mockResolvedValueOnce([sampleUniversities[1]]);
    const result = await searchUniversities(env, { type: '私立' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('私立淡江大學');
  });

  it('returns error when no search criteria provided', async () => {
    const result = await searchUniversities(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少提供一個搜尋條件');
  });

  it('handles empty results', async () => {
    mockFetchUniversities.mockResolvedValueOnce([]);
    const result = await searchUniversities(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchUniversities.mockRejectedValueOnce(new Error('API down'));
    const result = await searchUniversities(env, { keyword: '大學' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('limits results to 50', async () => {
    const manyResults = Array.from({ length: 60 }, (_, i) => ({
      ...sampleUniversities[0],
      name: `大學${i}`,
    }));
    mockFetchUniversities.mockResolvedValueOnce(manyResults);
    const result = await searchUniversities(env, { keyword: '大學' });
    expect(result.content[0].text).toContain('顯示前 50 所');
  });
});

// --- searchSchools ---
describe('searchSchools', () => {
  it('returns results for keyword search across all levels', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(allSchools);
    const result = await searchSchools(env, { keyword: '國立' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('學校');
  });

  it('returns results filtered by level', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleJuniorHighs);
    const result = await searchSchools(env, { level: '國民中學' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('國民中學');
  });

  it('returns results filtered by city', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([sampleUniversities[0], sampleJuniorHighs[0]]);
    const result = await searchSchools(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('2 所學校');
  });

  it('returns error when no search criteria provided', async () => {
    const result = await searchSchools(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少提供一個搜尋條件');
  });

  it('returns error for invalid level', async () => {
    const result = await searchSchools(env, { level: '幼稚園' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不在支援範圍');
  });

  it('handles empty results', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([]);
    const result = await searchSchools(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllSchools.mockRejectedValueOnce(new Error('Network error'));
    const result = await searchSchools(env, { keyword: '大學' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error');
  });

  it('accepts partial level match like 中學', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleJuniorHighs);
    const result = await searchSchools(env, { level: '中學' });
    expect(result.isError).toBeUndefined();
  });
});

// --- getSchoolDetails ---
describe('getSchoolDetails', () => {
  it('returns details for exact name match', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([sampleUniversities[0]]);
    const result = await getSchoolDetails(env, { name: '國立臺灣大學' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('國立臺灣大學');
    expect(parsed.code).toBe('0003');
    expect(parsed.city).toBe('臺北市');
    expect(parsed.phone).toBeDefined();
    expect(parsed.website).toBeDefined();
  });

  it('returns details for partial name match', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([sampleUniversities[0]]);
    const result = await getSchoolDetails(env, { name: '臺灣大學' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('國立臺灣大學');
  });

  it('returns error when name is empty', async () => {
    const result = await getSchoolDetails(env, { name: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供學校名稱');
  });

  it('returns error when name is missing', async () => {
    const result = await getSchoolDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供學校名稱');
  });

  it('handles no match with suggestions', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleUniversities);
    const result = await getSchoolDetails(env, { name: '某某大學' });
    // Should still return records since keyword "某某大學" won't match,
    // but fetchAllSchools is mocked to return sampleUniversities
    expect(result.content[0].text).toContain('查無');
  });

  it('handles no match with empty results', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([]);
    const result = await getSchoolDetails(env, { name: '不存在的學校' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllSchools.mockRejectedValueOnce(new Error('Timeout'));
    const result = await getSchoolDetails(env, { name: '臺灣大學' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Timeout');
  });

  it('trims whitespace from name', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([sampleUniversities[0]]);
    const result = await getSchoolDetails(env, { name: '  臺灣大學  ' });
    expect(result.isError).toBeUndefined();
  });
});

// --- getEducationStats ---
describe('getEducationStats', () => {
  it('returns nationwide statistics', async () => {
    mockFetchUniversities.mockResolvedValueOnce(sampleUniversities);
    mockFetchJuniorHighSchools.mockResolvedValueOnce(sampleJuniorHighs);
    mockFetchHighSchools.mockResolvedValueOnce(sampleHighSchools);
    const result = await getEducationStats(env, {});
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.scope).toBe('全國');
    expect(parsed.total).toBe(4);
    expect(parsed.breakdown).toBeDefined();
    expect(parsed.breakdown['大專校院'].total).toBe(2);
    expect(parsed.breakdown['國民中學'].total).toBe(1);
    expect(parsed.breakdown['高級中等學校'].total).toBe(1);
  });

  it('returns city-specific statistics', async () => {
    mockFetchUniversities.mockResolvedValueOnce([sampleUniversities[0]]);
    mockFetchJuniorHighSchools.mockResolvedValueOnce(sampleJuniorHighs);
    mockFetchHighSchools.mockResolvedValueOnce([]);
    const result = await getEducationStats(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.scope).toBe('臺北市');
    expect(parsed.total).toBe(2);
  });

  it('counts public and private schools', async () => {
    mockFetchUniversities.mockResolvedValueOnce(sampleUniversities);
    mockFetchJuniorHighSchools.mockResolvedValueOnce([]);
    mockFetchHighSchools.mockResolvedValueOnce([]);
    const result = await getEducationStats(env, {});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.breakdown['大專校院'].public).toBe(1);
    expect(parsed.breakdown['大專校院'].private).toBe(1);
  });

  it('includes top cities for nationwide stats', async () => {
    mockFetchUniversities.mockResolvedValueOnce(sampleUniversities);
    mockFetchJuniorHighSchools.mockResolvedValueOnce(sampleJuniorHighs);
    mockFetchHighSchools.mockResolvedValueOnce(sampleHighSchools);
    const result = await getEducationStats(env, {});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.topCities).toBeDefined();
    expect(Array.isArray(parsed.topCities)).toBe(true);
  });

  it('omits top cities for city-specific stats', async () => {
    mockFetchUniversities.mockResolvedValueOnce([sampleUniversities[0]]);
    mockFetchJuniorHighSchools.mockResolvedValueOnce([]);
    mockFetchHighSchools.mockResolvedValueOnce([]);
    const result = await getEducationStats(env, { city: '臺北市' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.topCities).toBeUndefined();
  });

  it('handles empty results for a city', async () => {
    mockFetchUniversities.mockResolvedValueOnce([]);
    mockFetchJuniorHighSchools.mockResolvedValueOnce([]);
    mockFetchHighSchools.mockResolvedValueOnce([]);
    const result = await getEducationStats(env, { city: '不存在市' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchUniversities.mockRejectedValueOnce(new Error('Server error'));
    mockFetchJuniorHighSchools.mockResolvedValueOnce([]);
    mockFetchHighSchools.mockResolvedValueOnce([]);
    const result = await getEducationStats(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Server error');
  });
});

// --- searchByLocation ---
describe('searchByLocation', () => {
  it('returns schools for a city', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(allSchools.filter((s) => s.city === '臺北市'));
    const result = await searchByLocation(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('學校列表');
  });

  it('filters by district using address', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleUniversities);
    const result = await searchByLocation(env, { city: '臺北市', district: '大安區' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大安區');
    expect(result.content[0].text).toContain('國立臺灣大學');
  });

  it('returns error when city is empty', async () => {
    const result = await searchByLocation(env, { city: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市名稱');
  });

  it('returns error when city is missing', async () => {
    const result = await searchByLocation(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市名稱');
  });

  it('handles no results for city', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([]);
    const result = await searchByLocation(env, { city: '不存在市' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles no results for district within city', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleUniversities);
    const result = await searchByLocation(env, { city: '臺北市', district: '不存在區' });
    expect(result.content[0].text).toContain('查無');
  });

  it('groups results by school level', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(allSchools);
    const result = await searchByLocation(env, { city: '全部' });
    expect(result.content[0].text).toContain('大專校院');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllSchools.mockRejectedValueOnce(new Error('Connection reset'));
    const result = await searchByLocation(env, { city: '臺北市' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Connection reset');
  });
});
