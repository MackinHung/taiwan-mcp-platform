import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module
vi.mock('../src/client.js', () => ({
  isWithinTaiwan: vi.fn(),
  normalizeCity: vi.fn((c: string) => c.replace(/台/g, '臺')),
  detectCityFromCoords: vi.fn(),
  fetchArcGis: vi.fn(),
  fetchTaichungApi: vi.fn(),
  buildSpatialQueryParams: vi.fn(() => ({
    where: '1=1',
    geometry: '121.565,25.033',
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
  })),
  ARCGIS_LAYERS: { ZONING: 89, PUBLIC_FACILITIES: 90, URBAN_RENEWAL: 91 },
  API_URLS: {
    TAIPEI_ARCGIS: 'https://www.historygis.udd.taipei.gov.tw/arcgis/rest/services/Urban/EMap/MapServer',
    TAICHUNG_API: 'https://datacenter.taichung.gov.tw/swagger/OpenData',
  },
}));

import {
  isWithinTaiwan,
  detectCityFromCoords,
  fetchArcGis,
  fetchTaichungApi,
} from '../src/client.js';
import { queryZoningByLocation, listUrbanZones } from '../src/tools/zoning.js';
import type { Env } from '../src/types.js';

const mockIsWithinTaiwan = vi.mocked(isWithinTaiwan);
const mockDetectCity = vi.mocked(detectCityFromCoords);
const mockFetchArcGis = vi.mocked(fetchArcGis);
const mockFetchTaichungApi = vi.mocked(fetchTaichungApi);

const env: Env = { SERVER_NAME: 'taiwan-zoning', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
  mockIsWithinTaiwan.mockReturnValue(true);
  mockDetectCity.mockReturnValue('臺北市');
});

// --- queryZoningByLocation ---
describe('queryZoningByLocation', () => {
  it('returns zoning data for valid Taipei coordinates', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [{
        attributes: {
          NAME: '住宅區',
          ZONE_CODE: 'R',
          AREA_SQM: 12345.67,
          PLAN_NAME: '信義計畫區',
        },
      }],
    });

    const result = await queryZoningByLocation(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('住宅區');
    expect(result.content[0].text).toContain('R');
    expect(result.content[0].text).toContain('12345.67');
    expect(result.content[0].text).toContain('信義計畫區');
  });

  it('returns empty result when no features found', async () => {
    mockFetchArcGis.mockResolvedValueOnce({ features: [] });

    const result = await queryZoningByLocation(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無使用分區資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchArcGis.mockRejectedValueOnce(new Error('ArcGIS timeout'));

    const result = await queryZoningByLocation(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('ArcGIS timeout');
  });

  it('returns error for coordinates outside Taiwan', async () => {
    mockIsWithinTaiwan.mockReturnValue(false);

    const result = await queryZoningByLocation(env, { latitude: 35.0, longitude: 139.0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('座標不在台灣範圍內');
  });

  it('returns error for missing coordinates', async () => {
    const result = await queryZoningByLocation(env, { latitude: 'abc', longitude: null });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('有效的經緯度');
  });

  it('routes to Taichung API for Taichung coordinates', async () => {
    mockDetectCity.mockReturnValue('臺中市');
    mockFetchTaichungApi.mockResolvedValueOnce({
      success: true,
      result: [{
        zone_name: '商業區',
        zone_code: 'C',
        area_sqm: 5000,
        plan_name: '台中七期',
      }],
    });

    const result = await queryZoningByLocation(env, { latitude: 24.15, longitude: 120.68 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('商業區');
    expect(result.content[0].text).toContain('臺中市');
  });

  it('routes to Taichung when city arg is 台中市', async () => {
    mockFetchTaichungApi.mockResolvedValueOnce({
      success: true,
      result: [{ zone_name: '工業區', zone_code: 'I', area_sqm: 8000, plan_name: '' }],
    });

    const result = await queryZoningByLocation(env, { latitude: 24.15, longitude: 120.68, city: '台中市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('工業區');
  });

  it('handles Taichung empty result', async () => {
    mockDetectCity.mockReturnValue('臺中市');
    mockFetchTaichungApi.mockResolvedValueOnce({ success: true, result: [] });

    const result = await queryZoningByLocation(env, { latitude: 24.15, longitude: 120.68 });
    expect(result.content[0].text).toContain('查無臺中市使用分區資料');
  });
});

// --- listUrbanZones ---
describe('listUrbanZones', () => {
  it('returns zone statistics for Taipei', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [
        { attributes: { NAME: '住宅區', ZONE_CODE: 'R', COUNT: 150, TOTAL_AREA: 5000000 } },
        { attributes: { NAME: '商業區', ZONE_CODE: 'C', COUNT: 50, TOTAL_AREA: 2000000 } },
      ],
    });

    const result = await listUrbanZones(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('住宅區');
    expect(result.content[0].text).toContain('商業區');
    expect(result.content[0].text).toContain('150');
  });

  it('returns empty result when no statistics found', async () => {
    mockFetchArcGis.mockResolvedValueOnce({ features: [] });

    const result = await listUrbanZones(env, { city: '臺北市' });
    expect(result.content[0].text).toContain('查無分區統計資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchArcGis.mockRejectedValueOnce(new Error('server error'));

    const result = await listUrbanZones(env, { city: '臺北市' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('returns error when city is missing', async () => {
    const result = await listUrbanZones(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('城市名稱');
  });

  it('filters by zone_type when specified', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [
        { attributes: { NAME: '住宅區', ZONE_CODE: 'R', COUNT: 150, TOTAL_AREA: 5000000 } },
      ],
    });

    const result = await listUrbanZones(env, { city: '臺北市', zone_type: 'residential' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('residential');
  });

  it('routes to Taichung API for 臺中市', async () => {
    mockFetchTaichungApi.mockResolvedValueOnce({
      success: true,
      result: [
        { zone_name: '住宅區', zone_code: 'R', area_sqm: 3000000 },
      ],
    });

    const result = await listUrbanZones(env, { city: '台中市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('住宅區');
    expect(result.content[0].text).toContain('臺中市');
  });

  it('handles Taichung empty stats', async () => {
    mockFetchTaichungApi.mockResolvedValueOnce({ success: true, result: [] });

    const result = await listUrbanZones(env, { city: '台中市' });
    expect(result.content[0].text).toContain('查無分區統計資料');
  });
});
