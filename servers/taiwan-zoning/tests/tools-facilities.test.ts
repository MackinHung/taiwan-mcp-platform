import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/client.js', () => ({
  isWithinTaiwan: vi.fn(),
  detectCityFromCoords: vi.fn(),
  fetchArcGis: vi.fn(),
  buildBufferQueryParams: vi.fn(() => ({
    where: '1=1',
    geometry: '121.46,24.93,121.67,25.13',
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    distance: '500',
    units: 'esriSRUnit_Meter',
  })),
  ARCGIS_LAYERS: { ZONING: 89, PUBLIC_FACILITIES: 90, URBAN_RENEWAL: 91 },
}));

import { isWithinTaiwan, detectCityFromCoords, fetchArcGis } from '../src/client.js';
import { queryPublicFacilities } from '../src/tools/facilities.js';
import type { Env } from '../src/types.js';

const mockIsWithinTaiwan = vi.mocked(isWithinTaiwan);
const mockDetectCity = vi.mocked(detectCityFromCoords);
const mockFetchArcGis = vi.mocked(fetchArcGis);

const env: Env = { SERVER_NAME: 'taiwan-zoning', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
  mockIsWithinTaiwan.mockReturnValue(true);
  mockDetectCity.mockReturnValue('臺北市');
});

describe('queryPublicFacilities', () => {
  it('returns facilities data for valid coordinates', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [
        {
          attributes: {
            NAME: '大安森林公園',
            FACILITY_TYPE: '公園',
            AREA_SQM: 259000,
          },
        },
        {
          attributes: {
            NAME: '建國中學',
            FACILITY_TYPE: '學校',
            AREA_SQM: 48000,
          },
        },
      ],
    });

    const result = await queryPublicFacilities(env, { latitude: 25.033, longitude: 121.535 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大安森林公園');
    expect(result.content[0].text).toContain('建國中學');
    expect(result.content[0].text).toContain('公園');
    expect(result.content[0].text).toContain('共 2 筆');
  });

  it('returns empty result when no facilities found', async () => {
    mockFetchArcGis.mockResolvedValueOnce({ features: [] });

    const result = await queryPublicFacilities(env, { latitude: 25.033, longitude: 121.535 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無附近公共設施用地');
  });

  it('handles API error gracefully', async () => {
    mockFetchArcGis.mockRejectedValueOnce(new Error('connection refused'));

    const result = await queryPublicFacilities(env, { latitude: 25.033, longitude: 121.535 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('returns error for coordinates outside Taiwan', async () => {
    mockIsWithinTaiwan.mockReturnValue(false);

    const result = await queryPublicFacilities(env, { latitude: 35.0, longitude: 139.0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('座標不在台灣範圍內');
  });

  it('returns error for missing coordinates', async () => {
    const result = await queryPublicFacilities(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('有效的經緯度');
  });

  it('returns error for invalid radius', async () => {
    const result = await queryPublicFacilities(env, {
      latitude: 25.033,
      longitude: 121.535,
      radius_meters: -100,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('搜尋半徑必須在 1 至 5000');
  });

  it('returns error for radius exceeding 5000', async () => {
    const result = await queryPublicFacilities(env, {
      latitude: 25.033,
      longitude: 121.535,
      radius_meters: 10000,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('搜尋半徑必須在 1 至 5000');
  });

  it('filters by facility_type when specified', async () => {
    mockFetchArcGis.mockResolvedValueOnce({
      features: [{
        attributes: { NAME: '中正公園', FACILITY_TYPE: '公園', AREA_SQM: 15000 },
      }],
    });

    const result = await queryPublicFacilities(env, {
      latitude: 25.033,
      longitude: 121.535,
      facility_type: 'park',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中正公園');
    expect(result.content[0].text).toContain('設施類型：park');
  });
});
