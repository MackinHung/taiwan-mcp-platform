import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildUrl,
  fetchPopulation,
  fetchAgeDistribution,
  fetchVitalStats,
  getDefaultYyyymm,
  DATASET_POPULATION,
  DATASET_AGE_DISTRIBUTION,
  DATASET_VITAL_STATS,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('getDefaultYyyymm', () => {
  it('returns a 6-digit string', () => {
    const result = getDefaultYyyymm();
    expect(result).toMatch(/^\d{6}$/);
  });

  it('starts with current year', () => {
    const result = getDefaultYyyymm();
    const year = new Date().getFullYear();
    expect(result.startsWith(String(year))).toBe(true);
  });
});

describe('buildUrl', () => {
  it('builds URL with dataset and yyyymm path', () => {
    const url = buildUrl('ODRP010', '202603');
    expect(url).toContain('https://www.ris.gov.tw/rs-opendata/api/v1/datastore/ODRP010/202603');
  });

  it('includes query params when provided', () => {
    const url = buildUrl('ODRP010', '202603', { COUNTY: '臺北市' });
    expect(url).toContain('COUNTY=');
    expect(decodeURIComponent(url)).toContain('臺北市');
  });

  it('builds URL without extra params when none given', () => {
    const url = buildUrl('ODRP049', '202601');
    expect(url).toBe('https://www.ris.gov.tw/rs-opendata/api/v1/datastore/ODRP049/202601');
  });

  it('uses correct dataset IDs', () => {
    expect(DATASET_POPULATION).toBe('ODRP010');
    expect(DATASET_AGE_DISTRIBUTION).toBe('ODRP049');
    expect(DATASET_VITAL_STATS).toBe('ODRP024');
  });
});

describe('fetchPopulation', () => {
  it('fetches and returns population records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responseData: [
          { county: '臺北市', town: '中正區', population_total: '100000', population_male: '48000', population_female: '52000', household: '40000' },
          { county: '臺北市', town: '大安區', population_total: '120000', population_male: '58000', population_female: '62000', household: '50000' },
        ],
      }),
    });

    const result = await fetchPopulation('202603');
    expect(result).toHaveLength(2);
    expect(result[0].county).toBe('臺北市');
  });

  it('passes county as COUNTY param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseData: [] }),
    });

    await fetchPopulation('202603', '臺北市');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('COUNTY=臺北市');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchPopulation('202603')).rejects.toThrow('RIS API error');
  });

  it('returns empty array when no responseData', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchPopulation('202603');
    expect(result).toEqual([]);
  });

  it('uses ODRP010 dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseData: [] }),
    });

    await fetchPopulation('202603');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('ODRP010');
    expect(calledUrl).toContain('202603');
  });
});

describe('fetchAgeDistribution', () => {
  it('fetches age distribution records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responseData: [
          { age: '0', population_male: '100', population_female: '95' },
          { age: '25', population_male: '500', population_female: '520' },
        ],
      }),
    });

    const result = await fetchAgeDistribution('202603');
    expect(result).toHaveLength(2);
  });

  it('uses ODRP049 dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseData: [] }),
    });

    await fetchAgeDistribution('202603');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('ODRP049');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchAgeDistribution('202603')).rejects.toThrow('RIS API error');
  });

  it('passes county param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseData: [] }),
    });

    await fetchAgeDistribution('202603', '新北市');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('COUNTY=新北市');
  });
});

describe('fetchVitalStats', () => {
  it('fetches vital stats records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responseData: [
          { county: '臺北市', birth_total: '200', death_total: '150', marry_pair: '50', divorce_pair: '20' },
        ],
      }),
    });

    const result = await fetchVitalStats('202603');
    expect(result).toHaveLength(1);
    expect(result[0].birth_total).toBe('200');
  });

  it('uses ODRP024 dataset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseData: [] }),
    });

    await fetchVitalStats('202603');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('ODRP024');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchVitalStats('202603')).rejects.toThrow('RIS API error');
  });

  it('passes county param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseData: [] }),
    });

    await fetchVitalStats('202603', '高雄市');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('COUNTY=高雄市');
  });
});
