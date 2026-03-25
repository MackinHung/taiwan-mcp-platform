import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isWithinTaiwan,
  normalizeCity,
  detectCityFromCoords,
  buildArcGisQueryUrl,
  buildSpatialQueryParams,
  buildBufferQueryParams,
  fetchWithTimeout,
  fetchArcGis,
  fetchTaichungApi,
  fetchNlscWfs,
  API_URLS,
  ARCGIS_LAYERS,
  TAIWAN_BOUNDS,
  CITY_BOUNDS,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// --- Constants ---
describe('API_URLS', () => {
  it('contains all required API base URLs', () => {
    expect(API_URLS.TAIPEI_ARCGIS).toContain('historygis.udd.taipei.gov.tw');
    expect(API_URLS.TAICHUNG_API).toContain('datacenter.taichung.gov.tw');
    expect(API_URLS.NLSC_WMS).toContain('maps.nlsc.gov.tw');
    expect(API_URLS.NLSC_WFS).toContain('maps.nlsc.gov.tw');
  });
});

describe('ARCGIS_LAYERS', () => {
  it('contains zoning, facilities, and renewal layer IDs', () => {
    expect(ARCGIS_LAYERS.ZONING).toBe(89);
    expect(ARCGIS_LAYERS.PUBLIC_FACILITIES).toBe(90);
    expect(ARCGIS_LAYERS.URBAN_RENEWAL).toBe(91);
  });
});

describe('TAIWAN_BOUNDS', () => {
  it('defines valid Taiwan bounding box', () => {
    expect(TAIWAN_BOUNDS.minLat).toBeLessThan(TAIWAN_BOUNDS.maxLat);
    expect(TAIWAN_BOUNDS.minLng).toBeLessThan(TAIWAN_BOUNDS.maxLng);
  });
});

// --- isWithinTaiwan ---
describe('isWithinTaiwan', () => {
  it('returns true for coordinates inside Taiwan', () => {
    expect(isWithinTaiwan(25.033, 121.565)).toBe(true); // Taipei
  });

  it('returns true for southern Taiwan', () => {
    expect(isWithinTaiwan(22.627, 120.301)).toBe(true); // Kaohsiung
  });

  it('returns false for coordinates outside Taiwan', () => {
    expect(isWithinTaiwan(35.0, 139.0)).toBe(false); // Tokyo
  });

  it('returns false for negative coordinates', () => {
    expect(isWithinTaiwan(-25.0, -120.0)).toBe(false);
  });
});

// --- normalizeCity ---
describe('normalizeCity', () => {
  it('converts 台 to 臺', () => {
    expect(normalizeCity('台北市')).toBe('臺北市');
    expect(normalizeCity('台中市')).toBe('臺中市');
    expect(normalizeCity('台南市')).toBe('臺南市');
  });

  it('keeps already normalized names unchanged', () => {
    expect(normalizeCity('臺北市')).toBe('臺北市');
  });

  it('handles multiple occurrences', () => {
    expect(normalizeCity('台台台')).toBe('臺臺臺');
  });
});

// --- detectCityFromCoords ---
describe('detectCityFromCoords', () => {
  it('detects Taipei from coordinates', () => {
    expect(detectCityFromCoords(25.033, 121.565)).toBe('臺北市');
  });

  it('detects Taichung from coordinates', () => {
    expect(detectCityFromCoords(24.15, 120.68)).toBe('臺中市');
  });

  it('detects Kaohsiung from coordinates', () => {
    expect(detectCityFromCoords(22.627, 120.301)).toBe('高雄市');
  });

  it('returns null for coordinates not matching any city', () => {
    expect(detectCityFromCoords(23.0, 120.0)).toBeNull(); // Between cities
  });
});

// --- buildArcGisQueryUrl ---
describe('buildArcGisQueryUrl', () => {
  it('constructs correct URL with layer ID and params', () => {
    const url = buildArcGisQueryUrl(89, { where: '1=1', outFields: '*' });
    expect(url).toContain('/89/query');
    expect(url).toContain('f=json');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('where')).toBe('1=1');
    expect(parsed.searchParams.get('outFields')).toBe('*');
  });

  it('handles empty params', () => {
    const url = buildArcGisQueryUrl(89, {});
    expect(url).toContain('/89/query');
    expect(url).toContain('f=json');
  });
});

// --- buildSpatialQueryParams ---
describe('buildSpatialQueryParams', () => {
  it('builds correct spatial query parameters', () => {
    const params = buildSpatialQueryParams(25.033, 121.565);
    expect(params.geometry).toBe('121.565,25.033');
    expect(params.geometryType).toBe('esriGeometryPoint');
    expect(params.spatialRel).toBe('esriSpatialRelIntersects');
    expect(params.outFields).toBe('*');
    expect(params.returnGeometry).toBe('false');
    expect(params.where).toBe('1=1');
  });

  it('accepts custom where clause', () => {
    const params = buildSpatialQueryParams(25.033, 121.565, "ZONE_CODE='R'");
    expect(params.where).toBe("ZONE_CODE='R'");
  });
});

// --- buildBufferQueryParams ---
describe('buildBufferQueryParams', () => {
  it('builds envelope geometry from radius', () => {
    const params = buildBufferQueryParams(25.033, 121.565, 500);
    expect(params.geometryType).toBe('esriGeometryEnvelope');
    expect(params.distance).toBe('500');
    expect(params.units).toBe('esriSRUnit_Meter');
    // The envelope should contain the center point
    const [minLng, minLat, maxLng, maxLat] = params.geometry.split(',').map(Number);
    expect(minLng).toBeLessThan(121.565);
    expect(maxLng).toBeGreaterThan(121.565);
    expect(minLat).toBeLessThan(25.033);
    expect(maxLat).toBeGreaterThan(25.033);
  });
});

// --- fetchWithTimeout ---
describe('fetchWithTimeout', () => {
  it('returns response on successful fetch', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    const res = await fetchWithTimeout('https://example.com');
    expect(res).toBeDefined();
    expect(await res.text()).toBe('ok');
  });

  it('passes abort signal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    await fetchWithTimeout('https://example.com');
    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1]?.signal).toBeDefined();
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('Network error');
  });
});

// --- fetchArcGis ---
describe('fetchArcGis', () => {
  it('returns features on successful query', async () => {
    const mockData = {
      features: [{ attributes: { NAME: '住宅區' }, geometry: null }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const result = await fetchArcGis(89, { where: '1=1' });
    expect(result.features).toHaveLength(1);
    expect(result.features[0].attributes.NAME).toBe('住宅區');
  });

  it('throws on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(fetchArcGis(89, {})).rejects.toThrow('ArcGIS API error: 500');
  });

  it('throws on ArcGIS error in response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { code: 400, message: 'Invalid query' } }),
    });
    await expect(fetchArcGis(89, {})).rejects.toThrow('ArcGIS query error: Invalid query');
  });

  it('propagates network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));
    await expect(fetchArcGis(89, {})).rejects.toThrow('timeout');
  });
});

// --- fetchTaichungApi ---
describe('fetchTaichungApi', () => {
  it('returns data on successful fetch', async () => {
    const mockData = { success: true, result: [{ zone_name: '住宅區', zone_code: 'R' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const result = await fetchTaichungApi('UrbanZoning', { lat: '24.15' });
    expect(result.result).toHaveLength(1);
  });

  it('throws on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    await expect(fetchTaichungApi('Unknown')).rejects.toThrow('Taichung API error: 404');
  });
});

// --- fetchNlscWfs ---
describe('fetchNlscWfs', () => {
  it('returns GeoJSON features on success', async () => {
    const mockData = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { LU_NAME: '農業' }, geometry: null }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    const result = await fetchNlscWfs('LUIMAP', { BBOX: '120,24,121,25' });
    expect(result.features).toHaveLength(1);
  });

  it('throws on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    await expect(fetchNlscWfs('LUIMAP')).rejects.toThrow('NLSC WFS error: 503');
  });
});
