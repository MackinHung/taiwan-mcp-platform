import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  API_URLS: {
    LANDSLIDE_ALERT: 'https://ls.ardswc.gov.tw/api/LandslideAlertOpenData',
    ACTIVE_FAULTS_CSV: 'https://www.gsmma.gov.tw/uploads/1718158875828SHvikG0X.csv',
    SENSITIVE_AREAS_GEOJSON: 'https://data.gov.tw/api/v2/rest/dataset/100220',
    WMS_BASE: 'https://geomap.gsmma.gov.tw/mapguide/mapagent/mapagent.fcgi',
  },
  buildWmsUrl: vi.fn(),
  fetchWithTimeout: vi.fn(),
  fetchLandslideAlerts: vi.fn(),
  fetchActiveFaultsCsv: vi.fn(),
  fetchSensitiveAreas: vi.fn(),
  fetchWmsFeatureInfo: vi.fn(),
  haversineDistance: vi.fn(),
  parseCsv: vi.fn(),
  getGeometryCentroid: vi.fn(),
}));

import {
  fetchLandslideAlerts,
  fetchActiveFaultsCsv,
  fetchSensitiveAreas,
  fetchWmsFeatureInfo,
  haversineDistance,
  parseCsv,
  getGeometryCentroid,
} from '../src/client.js';
import { queryLiquefactionPotential } from '../src/tools/liquefaction.js';
import { getActiveFaultsNearby } from '../src/tools/faults.js';
import { querySensitiveAreas } from '../src/tools/sensitive-areas.js';
import { getLandslideAlerts } from '../src/tools/landslide.js';
import { getGeologicalInfo } from '../src/tools/geological-info.js';
import type { Env } from '../src/types.js';

const mockFetchLandslideAlerts = vi.mocked(fetchLandslideAlerts);
const mockFetchActiveFaultsCsv = vi.mocked(fetchActiveFaultsCsv);
const mockFetchSensitiveAreas = vi.mocked(fetchSensitiveAreas);
const mockFetchWmsFeatureInfo = vi.mocked(fetchWmsFeatureInfo);
const mockHaversineDistance = vi.mocked(haversineDistance);
const mockParseCsv = vi.mocked(parseCsv);
const mockGetGeometryCentroid = vi.mocked(getGeometryCentroid);

const env: Env = {
  SERVER_NAME: 'taiwan-geology',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// queryLiquefactionPotential
// ============================================================
describe('queryLiquefactionPotential', () => {
  it('returns liquefaction level for valid coordinates', async () => {
    mockFetchWmsFeatureInfo.mockResolvedValueOnce('level=高潛勢\nzone=台北盆地');
    const result = await queryLiquefactionPotential(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('高潛勢');
    expect(result.content[0].text).toContain('25.033');
  });

  it('returns no data when WMS response is empty', async () => {
    mockFetchWmsFeatureInfo.mockResolvedValueOnce('');
    const result = await queryLiquefactionPotential(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('無土壤液化潛勢資料');
  });

  it('returns error when API fails', async () => {
    mockFetchWmsFeatureInfo.mockRejectedValueOnce(new Error('WMS timeout'));
    const result = await queryLiquefactionPotential(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('WMS timeout');
  });

  it('returns error for missing latitude/longitude', async () => {
    const result = await queryLiquefactionPotential(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('必須提供');
  });

  it('returns error for out-of-range coordinates', async () => {
    const result = await queryLiquefactionPotential(env, { latitude: 10.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('超出台灣範圍');
  });
});

// ============================================================
// getActiveFaultsNearby
// ============================================================
describe('getActiveFaultsNearby', () => {
  const sampleCsv = 'name,number,latitude,longitude,length_km,type,last_activity';

  it('returns nearby faults for valid coordinates', async () => {
    mockFetchActiveFaultsCsv.mockResolvedValueOnce(sampleCsv);
    mockParseCsv.mockReturnValueOnce([
      { name: '車籠埔斷層', number: 'F001', latitude: '24.1', longitude: '120.7', length_km: '92', type: '逆移斷層', last_activity: '1999' },
      { name: '新城斷層', number: 'F002', latitude: '24.15', longitude: '121.6', length_km: '30', type: '逆移斷層', last_activity: '全新世' },
    ]);
    mockHaversineDistance
      .mockReturnValueOnce(5.0)   // 車籠埔斷層
      .mockReturnValueOnce(15.0); // 新城斷層

    const result = await getActiveFaultsNearby(env, { latitude: 24.1, longitude: 120.7 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('車籠埔斷層');
    expect(result.content[0].text).toContain('5.0');
    expect(result.content[0].text).toContain('2 條活動斷層');
  });

  it('returns no faults when none within radius', async () => {
    mockFetchActiveFaultsCsv.mockResolvedValueOnce(sampleCsv);
    mockParseCsv.mockReturnValueOnce([
      { name: 'Far Fault', number: 'F099', latitude: '22.0', longitude: '120.0', length_km: '10', type: 'test', last_activity: 'test' },
    ]);
    mockHaversineDistance.mockReturnValueOnce(200.0);

    const result = await getActiveFaultsNearby(env, { latitude: 25.0, longitude: 121.5, radius_km: 10 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('無已知活動斷層');
  });

  it('returns error when API fails', async () => {
    mockFetchActiveFaultsCsv.mockRejectedValueOnce(new Error('CSV fetch failed'));
    const result = await getActiveFaultsNearby(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('CSV fetch failed');
  });

  it('returns error for missing coordinates', async () => {
    const result = await getActiveFaultsNearby(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('必須提供');
  });

  it('returns error when CSV has no data rows', async () => {
    mockFetchActiveFaultsCsv.mockResolvedValueOnce(sampleCsv);
    mockParseCsv.mockReturnValueOnce([]);
    const result = await getActiveFaultsNearby(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無法取得活動斷層資料');
  });
});

// ============================================================
// querySensitiveAreas
// ============================================================
describe('querySensitiveAreas', () => {
  it('returns nearby sensitive areas', async () => {
    mockFetchSensitiveAreas.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            SENSIT_ID: 'SA001',
            SENSIT_NAME: '山崩地滑地質敏感區',
            SENSIT_TYPE: '山崩地滑',
            COUNTY: '新北市',
            TOWN: '烏來區',
            ANNOUNCE_DATE: '2015-01-01',
            AREA_HA: 500,
          },
          geometry: { type: 'Point', coordinates: [121.5, 24.85] },
        },
      ],
    } as any);
    mockGetGeometryCentroid.mockReturnValueOnce({ lat: 24.85, lon: 121.5 });
    mockHaversineDistance.mockReturnValueOnce(2.0);

    const result = await querySensitiveAreas(env, { latitude: 24.85, longitude: 121.5 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('山崩地滑地質敏感區');
    expect(result.content[0].text).toContain('SA001');
    expect(result.content[0].text).toContain('1 個地質敏感區');
  });

  it('returns no areas when none within radius', async () => {
    mockFetchSensitiveAreas.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            SENSIT_ID: 'SA002', SENSIT_NAME: '遠方區域', SENSIT_TYPE: '斷層',
            COUNTY: '屏東縣', TOWN: '恆春鎮', ANNOUNCE_DATE: '2016-01-01', AREA_HA: 100,
          },
          geometry: { type: 'Point', coordinates: [120.7, 22.0] },
        },
      ],
    } as any);
    mockGetGeometryCentroid.mockReturnValueOnce({ lat: 22.0, lon: 120.7 });
    mockHaversineDistance.mockReturnValueOnce(300.0);

    const result = await querySensitiveAreas(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('無地質敏感區');
  });

  it('returns error when API fails', async () => {
    mockFetchSensitiveAreas.mockRejectedValueOnce(new Error('GeoJSON fetch failed'));
    const result = await querySensitiveAreas(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('GeoJSON fetch failed');
  });

  it('returns error for missing coordinates', async () => {
    const result = await querySensitiveAreas(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('必須提供');
  });

  it('handles empty features array', async () => {
    mockFetchSensitiveAreas.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [],
    } as any);

    const result = await querySensitiveAreas(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.content[0].text).toContain('無法取得地質敏感區資料');
  });
});

// ============================================================
// getLandslideAlerts
// ============================================================
describe('getLandslideAlerts', () => {
  const sampleAlerts = [
    {
      AlertType: '黃色警戒',
      LandslideID: 'LS001',
      County: '台南市',
      Town: '白河區',
      Village: '關嶺里',
      AlertLevel: 'yellow',
      LastUpdateDate: '2026-03-25T14:30:00Z',
      Latitude: 23.35,
      Longitude: 120.65,
    },
    {
      AlertType: '紅色警戒',
      LandslideID: 'LS002',
      County: '高雄市',
      Town: '那瑪夏區',
      Village: '',
      AlertLevel: 'red',
      LastUpdateDate: '2026-03-25T15:00:00Z',
      Latitude: 23.27,
      Longitude: 120.70,
    },
  ];

  it('returns all landslide alerts', async () => {
    mockFetchLandslideAlerts.mockResolvedValueOnce(sampleAlerts);
    const result = await getLandslideAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('高雄市');
    expect(result.content[0].text).toContain('2 筆');
  });

  it('filters by county', async () => {
    mockFetchLandslideAlerts.mockResolvedValueOnce(sampleAlerts);
    const result = await getLandslideAlerts(env, { county: '台南市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('1 筆');
  });

  it('filters by alert level (red)', async () => {
    mockFetchLandslideAlerts.mockResolvedValueOnce(sampleAlerts);
    const result = await getLandslideAlerts(env, { alert_level: 'red' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('紅色警戒');
    expect(result.content[0].text).toContain('1 筆');
  });

  it('returns no alerts message when empty', async () => {
    mockFetchLandslideAlerts.mockResolvedValueOnce([]);
    const result = await getLandslideAlerts(env, {});
    expect(result.content[0].text).toContain('目前無大規模崩塌警戒');
  });

  it('returns error when API fails', async () => {
    mockFetchLandslideAlerts.mockRejectedValueOnce(new Error('ARDSWC down'));
    const result = await getLandslideAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('ARDSWC down');
  });

  it('returns no-match message when filter finds nothing', async () => {
    mockFetchLandslideAlerts.mockResolvedValueOnce(sampleAlerts);
    const result = await getLandslideAlerts(env, { county: '花蓮縣' });
    expect(result.content[0].text).toContain('無符合條件');
    expect(result.content[0].text).toContain('花蓮縣');
  });
});

// ============================================================
// getGeologicalInfo
// ============================================================
describe('getGeologicalInfo', () => {
  it('returns geological info for valid coordinates', async () => {
    mockFetchWmsFeatureInfo.mockResolvedValueOnce(
      'formation=景美層\nage=更新世\nlithology=砂岩、頁岩互層\ncode=Jm'
    );
    const result = await getGeologicalInfo(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('景美層');
    expect(result.content[0].text).toContain('更新世');
    expect(result.content[0].text).toContain('砂岩');
  });

  it('returns no data when WMS response is empty', async () => {
    mockFetchWmsFeatureInfo.mockResolvedValueOnce('');
    const result = await getGeologicalInfo(env, { latitude: 22.0, longitude: 120.0 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('無地質圖資料');
  });

  it('returns error when API fails', async () => {
    mockFetchWmsFeatureInfo.mockRejectedValueOnce(new Error('WMS server error'));
    const result = await getGeologicalInfo(env, { latitude: 25.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('WMS server error');
  });

  it('returns error for missing coordinates', async () => {
    const result = await getGeologicalInfo(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('必須提供');
  });

  it('returns error for out-of-range coordinates', async () => {
    const result = await getGeologicalInfo(env, { latitude: 50.0, longitude: 121.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('超出台灣範圍');
  });
});
