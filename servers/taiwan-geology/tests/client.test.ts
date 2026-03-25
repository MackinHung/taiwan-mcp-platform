import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildWmsUrl,
  fetchWithTimeout,
  fetchLandslideAlerts,
  fetchActiveFaultsCsv,
  fetchSensitiveAreas,
  fetchWmsFeatureInfo,
  haversineDistance,
  parseCsv,
  getGeometryCentroid,
  API_URLS,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// --- buildWmsUrl ---
describe('buildWmsUrl', () => {
  it('constructs correct WMS URL with params', () => {
    const url = buildWmsUrl({ SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetMap' });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(API_URLS.WMS_BASE);
    expect(parsed.searchParams.get('SERVICE')).toBe('WMS');
    expect(parsed.searchParams.get('VERSION')).toBe('1.1.1');
    expect(parsed.searchParams.get('REQUEST')).toBe('GetMap');
  });

  it('handles empty params', () => {
    const url = buildWmsUrl({});
    expect(url).toBe(API_URLS.WMS_BASE);
  });
});

// --- fetchWithTimeout ---
describe('fetchWithTimeout', () => {
  it('returns response on success', async () => {
    const mockResponse = { ok: true, status: 200 };
    mockFetch.mockResolvedValueOnce(mockResponse);
    const result = await fetchWithTimeout('https://example.com');
    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('passes abort signal to fetch', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await fetchWithTimeout('https://example.com');
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('Network failure');
  });
});

// --- fetchLandslideAlerts ---
describe('fetchLandslideAlerts', () => {
  it('fetches and parses landslide alerts', async () => {
    const mockAlerts = [
      { AlertType: '黃色警戒', LandslideID: 'LS001', County: '台南市' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts,
    });

    const result = await fetchLandslideAlerts();
    expect(result).toEqual(mockAlerts);
    expect(mockFetch).toHaveBeenCalledWith(
      API_URLS.LANDSLIDE_ALERT,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });
    await expect(fetchLandslideAlerts()).rejects.toThrow('ARDSWC API error: 500 Internal Server Error');
  });
});

// --- fetchActiveFaultsCsv ---
describe('fetchActiveFaultsCsv', () => {
  it('fetches and returns CSV text', async () => {
    const csvText = 'name,lat,lon\nFault1,23.0,121.0';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => csvText,
    });

    const result = await fetchActiveFaultsCsv();
    expect(result).toBe(csvText);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(fetchActiveFaultsCsv()).rejects.toThrow('Active faults CSV error: 404 Not Found');
  });
});

// --- fetchSensitiveAreas ---
describe('fetchSensitiveAreas', () => {
  it('fetches and returns GeoJSON', async () => {
    const geoJson = { type: 'FeatureCollection', features: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geoJson,
    });

    const result = await fetchSensitiveAreas();
    expect(result).toEqual(geoJson);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' });
    await expect(fetchSensitiveAreas()).rejects.toThrow('Sensitive areas API error: 503 Service Unavailable');
  });
});

// --- fetchWmsFeatureInfo ---
describe('fetchWmsFeatureInfo', () => {
  it('fetches feature info for a coordinate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'formation=砂岩層\nage=第四紀',
    });

    const result = await fetchWmsFeatureInfo(25.0, 121.5, 'GeologicalMap_50K');
    expect(result).toContain('砂岩層');
  });

  it('throws on WMS error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });
    await expect(fetchWmsFeatureInfo(25.0, 121.5, 'Layer')).rejects.toThrow('WMS API error: 500 Server Error');
  });
});

// --- haversineDistance ---
describe('haversineDistance', () => {
  it('calculates distance between two points', () => {
    // Taipei to Kaohsiung roughly 300 km
    const dist = haversineDistance(25.0330, 121.5654, 22.6273, 120.3014);
    expect(dist).toBeGreaterThan(280);
    expect(dist).toBeLessThan(350);
  });

  it('returns 0 for same point', () => {
    const dist = haversineDistance(25.0, 121.5, 25.0, 121.5);
    expect(dist).toBe(0);
  });

  it('handles small distances accurately', () => {
    // About 1.1 km apart (0.01 degree latitude)
    const dist = haversineDistance(25.0, 121.5, 25.01, 121.5);
    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(1.2);
  });
});

// --- parseCsv ---
describe('parseCsv', () => {
  it('parses valid CSV with headers', () => {
    const csv = 'name,lat,lon\nFault1,23.0,121.0\nFault2,24.0,121.5';
    const result = parseCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Fault1', lat: '23.0', lon: '121.0' });
    expect(result[1]).toEqual({ name: 'Fault2', lat: '24.0', lon: '121.5' });
  });

  it('returns empty array for header-only CSV', () => {
    const csv = 'name,lat,lon';
    const result = parseCsv(csv);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    const result = parseCsv('');
    expect(result).toEqual([]);
  });

  it('handles quoted values', () => {
    const csv = '"name","lat","lon"\n"Fault A","23.5","121.2"';
    const result = parseCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Fault A');
  });
});

// --- getGeometryCentroid ---
describe('getGeometryCentroid', () => {
  it('returns centroid for Point geometry', () => {
    const result = getGeometryCentroid({ type: 'Point', coordinates: [121.5, 25.0] });
    expect(result).toEqual({ lat: 25.0, lon: 121.5 });
  });

  it('returns centroid for Polygon geometry', () => {
    const coords = [
      [[121.0, 25.0], [122.0, 25.0], [122.0, 26.0], [121.0, 26.0], [121.0, 25.0]],
    ];
    const result = getGeometryCentroid({ type: 'Polygon', coordinates: coords });
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(25.4, 0);
    expect(result!.lon).toBeCloseTo(121.4, 0);
  });

  it('returns centroid for MultiPolygon geometry', () => {
    const coords = [
      [[[121.0, 25.0], [122.0, 25.0], [122.0, 26.0], [121.0, 25.0]]],
    ];
    const result = getGeometryCentroid({ type: 'MultiPolygon', coordinates: coords });
    expect(result).not.toBeNull();
  });

  it('returns null for unsupported geometry type', () => {
    const result = getGeometryCentroid({ type: 'LineString', coordinates: [[121.0, 25.0], [122.0, 26.0]] });
    expect(result).toBeNull();
  });

  it('returns null for empty MultiPolygon', () => {
    const result = getGeometryCentroid({ type: 'MultiPolygon', coordinates: [] });
    expect(result).toBeNull();
  });
});

// --- API_URLS ---
describe('API_URLS', () => {
  it('contains all expected URLs', () => {
    expect(API_URLS.LANDSLIDE_ALERT).toBe('https://ls.ardswc.gov.tw/api/LandslideAlertOpenData');
    expect(API_URLS.ACTIVE_FAULTS_CSV).toBe('https://www.gsmma.gov.tw/uploads/1718158875828SHvikG0X.csv');
    expect(API_URLS.WMS_BASE).toBe('https://geomap.gsmma.gov.tw/mapguide/mapagent/mapagent.fcgi');
    expect(API_URLS.SENSITIVE_AREAS_GEOJSON).toContain('data.gov.tw');
  });
});
