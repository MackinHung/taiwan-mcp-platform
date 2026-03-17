import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: {
    FORECAST_36HR: 'F-C0032-001',
    FORECAST_7DAY: 'F-D0047-091',
    EARTHQUAKE: 'E-A0015-001',
    TYPHOON: 'W-C0034-001',
    WARNING: 'W-C0033-002',
    RAIN: 'O-A0002-001',
    TIDAL: 'F-A0021-001',
    UV: 'E-A0014-001',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { fetchDataset } from '../src/client.js';
import { getForecast36hr, getForecast7day } from '../src/tools/forecast.js';
import { getEarthquakeRecent } from '../src/tools/earthquake.js';
import { getTyphoonActive } from '../src/tools/typhoon.js';
import { getWeatherWarning } from '../src/tools/warning.js';
import { getRainObservation } from '../src/tools/rain.js';
import { getTidalForecast } from '../src/tools/tidal.js';
import { getUvIndex } from '../src/tools/uv.js';
import type { Env } from '../src/types.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  CWA_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-weather',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchDataset.mockReset();
});

// --- Forecast 36hr ---
describe('getForecast36hr', () => {
  const sampleRecords = {
    location: [
      {
        locationName: '臺北市',
        weatherElement: [
          {
            elementName: 'Wx',
            description: '天氣現象',
            time: [
              {
                startTime: '2026-03-17T06:00:00',
                endTime: '2026-03-17T18:00:00',
                elementValue: [{ value: '多雲', measures: '自訂' }],
              },
            ],
          },
          {
            elementName: 'MinT',
            description: '最低溫度',
            time: [
              {
                startTime: '2026-03-17T06:00:00',
                endTime: '2026-03-17T18:00:00',
                elementValue: [{ value: '18', measures: '攝氏度' }],
              },
            ],
          },
        ],
      },
    ],
  };

  it('returns forecast data for specific city', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getForecast36hr(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('多雲');
    expect(mockFetchDataset).toHaveBeenCalledWith('test-key', 'F-C0032-001', { locationName: '臺北市' });
  });

  it('returns all cities when no city specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getForecast36hr(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(mockFetchDataset).toHaveBeenCalledWith('test-key', 'F-C0032-001', {});
  });

  it('handles city not found gracefully', async () => {
    mockFetchDataset.mockResolvedValueOnce({ location: [] });
    const result = await getForecast36hr(env, { city: '不存在市' });
    expect(result.content[0].text).toContain('找不到 不存在市');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API down'));
    const result = await getForecast36hr(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Forecast 7day ---
describe('getForecast7day', () => {
  const sampleRecords = {
    location: [
      {
        locationName: '高雄市',
        weatherElement: [
          {
            elementName: 'Wx',
            description: '天氣現象',
            time: [
              {
                startTime: '2026-03-17T06:00:00',
                endTime: '2026-03-18T06:00:00',
                elementValue: [{ value: '晴時多雲', measures: '自訂' }],
              },
            ],
          },
        ],
      },
    ],
  };

  it('returns 7-day forecast for specific city', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getForecast7day(env, { city: '高雄市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('高雄市');
    expect(result.content[0].text).toContain('晴時多雲');
  });

  it('returns all cities when no city specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getForecast7day(env, {});
    expect(result.isError).toBeUndefined();
    expect(mockFetchDataset).toHaveBeenCalledWith('test-key', 'F-D0047-091', {});
  });

  it('handles city not found gracefully', async () => {
    mockFetchDataset.mockResolvedValueOnce({ location: [] });
    const result = await getForecast7day(env, { city: '不存在市' });
    expect(result.content[0].text).toContain('找不到 不存在市');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('timeout'));
    const result = await getForecast7day(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Earthquake ---
describe('getEarthquakeRecent', () => {
  const sampleRecords = {
    Earthquake: [
      {
        EarthquakeNo: 112001,
        ReportContent: '花蓮近海地震',
        ReportColor: '綠色',
        EarthquakeInfo: {
          OriginTime: '2026-03-17T02:30:00',
          Source: 'CWA',
          FocalDepth: 15,
          EpiCenter: { Location: '花蓮縣近海', EpiCenterLat: 23.9, EpiCenterLon: 121.6 },
          EarthquakeMagnitude: { MagnitudeType: 'ML', MagnitudeValue: 4.2 },
        },
      },
      {
        EarthquakeNo: 112002,
        ReportContent: '臺東近海地震',
        ReportColor: '綠色',
        EarthquakeInfo: {
          OriginTime: '2026-03-16T14:00:00',
          Source: 'CWA',
          FocalDepth: 20,
          EpiCenter: { Location: '臺東縣近海', EpiCenterLat: 22.8, EpiCenterLon: 121.1 },
          EarthquakeMagnitude: { MagnitudeType: 'ML', MagnitudeValue: 3.8 },
        },
      },
    ],
  };

  it('returns recent earthquakes with default limit=5', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getEarthquakeRecent(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('花蓮');
    expect(result.content[0].text).toContain('4.2');
  });

  it('respects custom limit parameter', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getEarthquakeRecent(env, { limit: 1 });
    expect(result.isError).toBeUndefined();
    // Should only contain info about the first earthquake
    expect(result.content[0].text).toContain('花蓮');
    // Verify fetchDataset was called (limit is applied after fetch)
    expect(mockFetchDataset).toHaveBeenCalledOnce();
  });

  it('handles empty earthquake data', async () => {
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] });
    const result = await getEarthquakeRecent(env, {});
    expect(result.content[0].text).toContain('無最近地震資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('server error'));
    const result = await getEarthquakeRecent(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Typhoon ---
describe('getTyphoonActive', () => {
  it('returns active typhoon info', async () => {
    const records = {
      tropicalCyclones: {
        tropicalCyclone: [
          {
            typhoonName: 'KOINU',
            cwaTyphoonName: '小犬',
            analysisData: {
              fixedDateTime: '2026-03-17T00:00:00',
              coordinate: '23.5N 121.5E',
              maxWindSpeed: { value: 35, unit: 'm/s' },
              movingSpeed: { value: 15, unit: 'km/hr' },
              pressure: { value: 965, unit: 'hPa' },
            },
          },
        ],
      },
    };
    mockFetchDataset.mockResolvedValueOnce(records);
    const result = await getTyphoonActive(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('KOINU');
    expect(result.content[0].text).toContain('小犬');
  });

  it('returns message when no active typhoons', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      tropicalCyclones: { tropicalCyclone: [] },
    });
    const result = await getTyphoonActive(env, {});
    expect(result.content[0].text).toContain('目前無活躍颱風');
  });

  it('handles missing tropicalCyclones data', async () => {
    mockFetchDataset.mockResolvedValueOnce({});
    const result = await getTyphoonActive(env, {});
    expect(result.content[0].text).toContain('目前無活躍颱風');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('fail'));
    const result = await getTyphoonActive(env, {});
    expect(result.isError).toBe(true);
  });
});

// --- Weather Warning ---
describe('getWeatherWarning', () => {
  const sampleRecords = {
    record: [
      {
        datasetDescription: '豪雨特報',
        hazardConditions: {
          hazards: {
            hazard: [
              {
                info: { phenomena: '豪雨', significance: '特報' },
                validTime: { startTime: '2026-03-17T00:00:00', endTime: '2026-03-17T23:59:00' },
                affectedAreas: {
                  location: [{ locationName: '臺北市' }, { locationName: '新北市' }],
                },
              },
            ],
          },
        },
      },
    ],
  };

  it('returns active warnings', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getWeatherWarning(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('豪雨');
  });

  it('filters by city when specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getWeatherWarning(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('returns message when no warnings', async () => {
    mockFetchDataset.mockResolvedValueOnce({ record: [] });
    const result = await getWeatherWarning(env, {});
    expect(result.content[0].text).toContain('目前無天氣警特報');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('err'));
    const result = await getWeatherWarning(env, {});
    expect(result.isError).toBe(true);
  });
});

// --- Rain Observation ---
describe('getRainObservation', () => {
  const sampleRecords = {
    Station: [
      {
        StationName: '臺北',
        GeoInfo: { CountyName: '臺北市' },
        RainfallElement: {
          Now: { Precipitation: 2.5 },
          Past1hr: { Precipitation: 5.0 },
          Past24hr: { Precipitation: 30.0 },
        },
        ObsTime: { DateTime: '2026-03-17T10:00:00' },
      },
      {
        StationName: '板橋',
        GeoInfo: { CountyName: '新北市' },
        RainfallElement: {
          Now: { Precipitation: 0 },
          Past1hr: { Precipitation: 1.0 },
          Past24hr: { Precipitation: 10.0 },
        },
        ObsTime: { DateTime: '2026-03-17T10:00:00' },
      },
    ],
  };

  it('returns rain data for specific city', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getRainObservation(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北');
    expect(result.content[0].text).not.toContain('板橋');
  });

  it('returns all stations when no city specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getRainObservation(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北');
    expect(result.content[0].text).toContain('板橋');
  });

  it('handles empty station data', async () => {
    mockFetchDataset.mockResolvedValueOnce({ Station: [] });
    const result = await getRainObservation(env, {});
    expect(result.content[0].text).toContain('無雨量觀測資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('rain error'));
    const result = await getRainObservation(env, {});
    expect(result.isError).toBe(true);
  });
});

// --- Tidal Forecast ---
describe('getTidalForecast', () => {
  const sampleRecords = {
    TideForecasts: {
      Location: [
        {
          LocationName: '基隆',
          TimePeriods: {
            Daily: [
              {
                Date: '2026-03-17',
                Time: [
                  { DateTime: '2026-03-17T03:00:00', Tide: '滿潮', TideHeights: { AboveTWVD: 1.2 } },
                  { DateTime: '2026-03-17T09:00:00', Tide: '乾潮', TideHeights: { AboveTWVD: -0.3 } },
                ],
              },
            ],
          },
        },
      ],
    },
  };

  it('returns tidal data for specific port', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getTidalForecast(env, { port: '基隆' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('基隆');
    expect(result.content[0].text).toContain('滿潮');
  });

  it('returns all ports when no port specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getTidalForecast(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('基隆');
  });

  it('handles empty tidal data', async () => {
    mockFetchDataset.mockResolvedValueOnce({ TideForecasts: { Location: [] } });
    const result = await getTidalForecast(env, {});
    expect(result.content[0].text).toContain('無潮汐資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('tidal error'));
    const result = await getTidalForecast(env, {});
    expect(result.isError).toBe(true);
  });
});

// --- UV Index ---
describe('getUvIndex', () => {
  const sampleRecords = {
    WeatherElement: {
      Location: [
        {
          LocationName: '臺北市',
          UVIndex: { UVIndex: 8, PublishAgency: 'CWA' },
        },
        {
          LocationName: '高雄市',
          UVIndex: { UVIndex: 11, PublishAgency: 'CWA' },
        },
      ],
    },
  };

  it('returns UV index data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getUvIndex(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('8');
  });

  it('filters by city when specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getUvIndex(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('handles empty UV data', async () => {
    mockFetchDataset.mockResolvedValueOnce({ WeatherElement: { Location: [] } });
    const result = await getUvIndex(env, {});
    expect(result.content[0].text).toContain('無紫外線資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('uv error'));
    const result = await getUvIndex(env, {});
    expect(result.isError).toBe(true);
  });
});
