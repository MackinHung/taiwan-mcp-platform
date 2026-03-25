import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/client.js', () => ({
  normalizeCity: vi.fn((c: string) => c.replace(/台/g, '臺')),
  fetchArcGis: vi.fn(),
  fetchTaichungApi: vi.fn(),
  ARCGIS_LAYERS: { ZONING: 89, PUBLIC_FACILITIES: 90, URBAN_RENEWAL: 91 },
}));

import { fetchArcGis, fetchTaichungApi } from '../src/client.js';
import { queryUrbanRenewalAreas } from '../src/tools/renewal.js';
import type { Env } from '../src/types.js';

const mockFetchArcGis = vi.mocked(fetchArcGis);
const mockFetchTaichungApi = vi.mocked(fetchTaichungApi);

const env: Env = { SERVER_NAME: 'taiwan-zoning', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('queryUrbanRenewalAreas', () => {
  it('returns renewal areas for Taipei', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [{
        attributes: {
          NAME: '南港車站都市更新',
          STATUS: '已核定',
          APPROVAL_DATE: '2023-06-15',
          AREA_SQM: 35000,
        },
      }],
    });

    const result = await queryUrbanRenewalAreas(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('南港車站都市更新');
    expect(result.content[0].text).toContain('已核定');
    expect(result.content[0].text).toContain('2023-06-15');
  });

  it('returns empty result when no renewal areas found', async () => {
    mockFetchArcGis.mockResolvedValueOnce({ features: [] });

    const result = await queryUrbanRenewalAreas(env, { city: '臺北市' });
    expect(result.content[0].text).toContain('查無都市更新/重劃區資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchArcGis.mockRejectedValueOnce(new Error('server unavailable'));

    const result = await queryUrbanRenewalAreas(env, { city: '臺北市' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server unavailable');
  });

  it('returns error when city is missing', async () => {
    const result = await queryUrbanRenewalAreas(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('城市名稱');
  });

  it('filters by status when specified', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [{
        attributes: {
          NAME: '信義計畫區更新案',
          STATUS: '規劃中',
          AREA_SQM: 20000,
        },
      }],
    });

    const result = await queryUrbanRenewalAreas(env, { city: '臺北市', status: 'planned' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('信義計畫區更新案');
    expect(result.content[0].text).toContain('planned');
  });

  it('routes to Taichung API for 臺中市', async () => {
    mockFetchTaichungApi.mockResolvedValueOnce({
      success: true,
      result: [{
        zone_name: '七期重劃區',
        zone_code: 'UR',
        status: '已完成',
        approval_date: '2020-01-01',
        area_sqm: 100000,
      }],
    });

    const result = await queryUrbanRenewalAreas(env, { city: '台中市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('七期重劃區');
    expect(result.content[0].text).toContain('已完成');
  });

  it('handles Taichung empty result', async () => {
    mockFetchTaichungApi.mockResolvedValueOnce({ success: true, result: [] });

    const result = await queryUrbanRenewalAreas(env, { city: '台中市' });
    expect(result.content[0].text).toContain('查無都市更新/重劃區資料');
  });

  it('handles Taichung API error gracefully', async () => {
    mockFetchTaichungApi.mockRejectedValueOnce(new Error('Taichung API down'));

    const result = await queryUrbanRenewalAreas(env, { city: '台中市' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Taichung API down');
  });
});
