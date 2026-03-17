import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: {
    EARTHQUAKE_FELT: 'E-A0015-001',
    EARTHQUAKE_LOCAL: 'E-A0016-001',
    WEATHER_WARNING: 'W-C0033-002',
    TYPHOON: 'W-C0034-001',
    HEAVY_RAIN: 'F-A0078-001',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { fetchDataset } from '../src/client.js';
import { getEarthquakeAlerts } from '../src/tools/earthquake.js';
import { getWeatherWarnings } from '../src/tools/weather-warning.js';
import { getTyphoonAlerts } from '../src/tools/typhoon.js';
import { getHeavyRainAlerts } from '../src/tools/heavy-rain.js';
import { getAlertSummary } from '../src/tools/alert-summary.js';
import type { Env } from '../src/types.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  CWA_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-weather-alert',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchDataset.mockReset();
});

// --- Earthquake Alerts ---
describe('getEarthquakeAlerts', () => {
  const feltRecords = {
    Earthquake: [
      {
        EarthquakeNo: 112001,
        ReportContent: '花蓮近海有感地震',
        ReportColor: '綠色',
        ReportImageURI: '',
        EarthquakeInfo: {
          OriginTime: '2026-03-17T02:30:00',
          Source: 'CWA',
          FocalDepth: 15,
          EpiCenter: { Location: '花蓮縣近海', EpiCenterLat: 23.9, EpiCenterLon: 121.6 },
          EarthquakeMagnitude: { MagnitudeType: 'ML', MagnitudeValue: 5.2 },
        },
        Intensity: {
          ShakingArea: [
            { AreaDesc: '花蓮', CountyName: '花蓮縣', InfoStatus: '報告', AreaIntensity: '4級' },
          ],
        },
      },
    ],
  };

  const localRecords = {
    Earthquake: [
      {
        EarthquakeNo: 112101,
        ReportContent: '宜蘭近海小區域地震',
        ReportColor: '綠色',
        ReportImageURI: '',
        EarthquakeInfo: {
          OriginTime: '2026-03-17T01:00:00',
          Source: 'CWA',
          FocalDepth: 10,
          EpiCenter: { Location: '宜蘭縣近海', EpiCenterLat: 24.5, EpiCenterLon: 121.8 },
          EarthquakeMagnitude: { MagnitudeType: 'ML', MagnitudeValue: 3.1 },
        },
      },
    ],
  };

  it('returns merged and sorted earthquake data from both datasets', async () => {
    mockFetchDataset.mockResolvedValueOnce(feltRecords);
    mockFetchDataset.mockResolvedValueOnce(localRecords);
    const result = await getEarthquakeAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('花蓮');
    expect(result.content[0].text).toContain('5.2');
    expect(result.content[0].text).toContain('宜蘭');
    // Felt (02:30) should come before local (01:00) in descending order
    const text = result.content[0].text;
    expect(text.indexOf('花蓮')).toBeLessThan(text.indexOf('宜蘭'));
  });

  it('handles empty earthquake data', async () => {
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] });
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] });
    const result = await getEarthquakeAlerts(env, {});
    expect(result.content[0].text).toContain('無符合條件的地震資料');
  });

  it('filters by minMagnitude', async () => {
    mockFetchDataset.mockResolvedValueOnce(feltRecords);
    mockFetchDataset.mockResolvedValueOnce(localRecords);
    const result = await getEarthquakeAlerts(env, { minMagnitude: 4.0 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('5.2');
    expect(result.content[0].text).not.toContain('3.1');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API down'));
    const result = await getEarthquakeAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('includes intensity data when available', async () => {
    mockFetchDataset.mockResolvedValueOnce(feltRecords);
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] });
    const result = await getEarthquakeAlerts(env, {});
    expect(result.content[0].text).toContain('花蓮縣(4級)');
  });
});

// --- Weather Warnings ---
describe('getWeatherWarnings', () => {
  const sampleRecords = {
    record: [
      {
        datasetDescription: '低溫特報',
        hazardConditions: {
          hazards: {
            hazard: [
              {
                info: { phenomena: '低溫', significance: '特報' },
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

  it('returns active weather warnings', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getWeatherWarnings(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('低溫特報');
    expect(result.content[0].text).toContain('臺北市');
  });

  it('returns message when no warnings', async () => {
    mockFetchDataset.mockResolvedValueOnce({ record: [] });
    const result = await getWeatherWarnings(env, {});
    expect(result.content[0].text).toContain('目前無天氣警特報');
  });

  it('filters by city when specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getWeatherWarnings(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
  });

  it('returns city-specific message when no warnings for that city', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getWeatherWarnings(env, { city: '高雄市' });
    expect(result.content[0].text).toContain('高雄市 目前無天氣警特報');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('timeout'));
    const result = await getWeatherWarnings(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Typhoon Alerts ---
describe('getTyphoonAlerts', () => {
  const sampleRecords = {
    tropicalCyclones: {
      tropicalCyclone: [
        {
          typhoonName: 'KOINU',
          cwaTyphoonName: '小犬',
          analysisData: {
            fixedDateTime: '2026-03-17T00:00:00',
            coordinate: '23.5N 121.5E',
            maxWindSpeed: { value: 35, unit: 'm/s' },
            gustSpeed: { value: 45, unit: 'm/s' },
            pressure: { value: 965, unit: 'hPa' },
            movingSpeed: { value: 15, unit: 'km/hr' },
            movingDirection: '北北西',
          },
          forecastData: [
            { fixedTime: '2026-03-18T00:00:00', coordinateLat: 24.0, coordinateLon: 121.0, maxWindSpeed: 30 },
          ],
        },
      ],
    },
  };

  it('returns active typhoon info', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getTyphoonAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('KOINU');
    expect(result.content[0].text).toContain('小犬');
    expect(result.content[0].text).toContain('35');
    expect(result.content[0].text).toContain('965');
  });

  it('returns message when no active typhoons', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      tropicalCyclones: { tropicalCyclone: [] },
    });
    const result = await getTyphoonAlerts(env, {});
    expect(result.content[0].text).toContain('目前無颱風警報');
  });

  it('includes forecast track and gust/direction info', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getTyphoonAlerts(env, {});
    expect(result.content[0].text).toContain('預測路徑');
    expect(result.content[0].text).toContain('陣風');
    expect(result.content[0].text).toContain('北北西');
  });

  it('handles missing tropicalCyclones data', async () => {
    mockFetchDataset.mockResolvedValueOnce({});
    const result = await getTyphoonAlerts(env, {});
    expect(result.content[0].text).toContain('目前無颱風警報');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('fail'));
    const result = await getTyphoonAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fail');
  });
});

// --- Heavy Rain Alerts ---
describe('getHeavyRainAlerts', () => {
  const sampleRecords = {
    record: [
      {
        datasetDescription: '豪雨特報',
        hazardConditions: {
          hazards: {
            hazard: [
              {
                info: { phenomena: '豪雨', significance: '特報' },
                validTime: { startTime: '2026-03-17T06:00:00', endTime: '2026-03-17T18:00:00' },
                affectedAreas: {
                  location: [{ locationName: '宜蘭縣' }, { locationName: '花蓮縣' }],
                },
              },
            ],
          },
        },
      },
    ],
  };

  it('returns heavy rain alerts', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getHeavyRainAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('豪雨特報');
    expect(result.content[0].text).toContain('宜蘭縣');
  });

  it('returns message when no alerts', async () => {
    mockFetchDataset.mockResolvedValueOnce({ record: [] });
    const result = await getHeavyRainAlerts(env, {});
    expect(result.content[0].text).toContain('目前無豪大雨特報');
  });

  it('filters by city when specified', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getHeavyRainAlerts(env, { city: '宜蘭縣' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('宜蘭縣');
  });

  it('returns city-specific message when no alerts for that city', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleRecords);
    const result = await getHeavyRainAlerts(env, { city: '臺北市' });
    expect(result.content[0].text).toContain('臺北市 目前無豪大雨特報');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('rain error'));
    const result = await getHeavyRainAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rain error');
  });
});

// --- Alert Summary ---
describe('getAlertSummary', () => {
  const feltRecords = {
    Earthquake: [
      {
        EarthquakeNo: 112001,
        ReportContent: '地震',
        ReportColor: '綠色',
        ReportImageURI: '',
        EarthquakeInfo: {
          OriginTime: '2026-03-17T02:30:00',
          Source: 'CWA',
          FocalDepth: 15,
          EpiCenter: { Location: '花蓮縣近海', EpiCenterLat: 23.9, EpiCenterLon: 121.6 },
          EarthquakeMagnitude: { MagnitudeType: 'ML', MagnitudeValue: 5.2 },
        },
      },
    ],
  };

  const warningRecords = {
    record: [
      {
        datasetDescription: '低溫特報',
        hazardConditions: {
          hazards: {
            hazard: [
              {
                info: { phenomena: '低溫', significance: '特報' },
                validTime: { startTime: '2026-03-17T00:00:00', endTime: '2026-03-17T23:59:00' },
                affectedAreas: { location: [{ locationName: '臺北市' }] },
              },
            ],
          },
        },
      },
    ],
  };

  const typhoonRecords = {
    tropicalCyclones: {
      tropicalCyclone: [
        {
          typhoonName: 'KOINU',
          cwaTyphoonName: '小犬',
          analysisData: { fixedDateTime: '2026-03-17T00:00:00', coordinate: '23.5N 121.5E' },
        },
      ],
    },
  };

  const heavyRainRecords = {
    record: [
      {
        datasetDescription: '豪雨特報',
        hazardConditions: {
          hazards: {
            hazard: [
              {
                info: { phenomena: '豪雨', significance: '特報' },
                validTime: { startTime: '2026-03-17T06:00:00', endTime: '2026-03-17T18:00:00' },
                affectedAreas: { location: [{ locationName: '宜蘭縣' }] },
              },
            ],
          },
        },
      },
    ],
  };

  it('returns summary with all alert types having data', async () => {
    mockFetchDataset.mockResolvedValueOnce(feltRecords);      // felt
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] }); // local
    mockFetchDataset.mockResolvedValueOnce(warningRecords);    // warning
    mockFetchDataset.mockResolvedValueOnce(typhoonRecords);    // typhoon
    mockFetchDataset.mockResolvedValueOnce(heavyRainRecords);  // heavy rain

    const result = await getAlertSummary(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('台灣即時預警摘要');
    expect(text).toContain('地震速報');
    expect(text).toContain('天氣警特報');
    expect(text).toContain('颱風警報');
    expect(text).toContain('豪大雨特報');
    expect(text).toContain('花蓮');
    expect(text).toContain('KOINU');
  });

  it('handles partial failures gracefully', async () => {
    mockFetchDataset.mockResolvedValueOnce(feltRecords);                   // felt
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] });            // local
    mockFetchDataset.mockRejectedValueOnce(new Error('warning fail'));     // warning
    mockFetchDataset.mockResolvedValueOnce(typhoonRecords);                // typhoon
    mockFetchDataset.mockRejectedValueOnce(new Error('rain fail'));        // heavy rain

    const result = await getAlertSummary(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('地震速報');
    expect(text).toContain('查詢失敗');
    expect(text).toContain('KOINU');
  });

  it('returns summary with all empty data', async () => {
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] }); // felt
    mockFetchDataset.mockResolvedValueOnce({ Earthquake: [] }); // local
    mockFetchDataset.mockResolvedValueOnce({ record: [] });     // warning
    mockFetchDataset.mockResolvedValueOnce({});                 // typhoon
    mockFetchDataset.mockResolvedValueOnce({ record: [] });     // heavy rain

    const result = await getAlertSummary(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('生效中警報總數: 0');
  });

  it('handles all datasets failing', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('fail1'));
    mockFetchDataset.mockRejectedValueOnce(new Error('fail2'));
    mockFetchDataset.mockRejectedValueOnce(new Error('fail3'));
    mockFetchDataset.mockRejectedValueOnce(new Error('fail4'));
    mockFetchDataset.mockRejectedValueOnce(new Error('fail5'));

    const result = await getAlertSummary(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('台灣即時預警摘要');
    expect(text).toContain('生效中警報總數: 0');
  });
});
