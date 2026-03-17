import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, AqiStation } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  DATASETS: { AQI_CURRENT: 'aqx_p_432' },
  buildUrl: vi.fn(),
  fetchAqiData: vi.fn(),
}));

import { fetchAqiData } from '../src/client.js';
import { getAqi, getStationDetail } from '../src/tools/aqi.js';
import { getPm25Ranking } from '../src/tools/ranking.js';
import { getUnhealthyStations, getCountySummary } from '../src/tools/alert.js';

const mockFetchAqiData = vi.mocked(fetchAqiData);

const env: Env = {
  MOENV_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-air-quality',
  SERVER_VERSION: '1.0.0',
};

function makeStation(overrides: Partial<AqiStation> = {}): AqiStation {
  return {
    sitename: '松山',
    county: '臺北市',
    aqi: '50',
    pollutant: '',
    status: '良好',
    so2: '2',
    co: '0.3',
    o3: '30',
    o3_8hr: '25',
    pm10: '20',
    'pm2.5': '12',
    no2: '10',
    nox: '15',
    no: '5',
    wind_speed: '2.1',
    wind_direc: '180',
    publishtime: '2026-03-17 14:00',
    pm2_5_avg: '11',
    pm10_avg: '19',
    co_8hr: '0.3',
    so2_avg: '2',
    longitude: '121.5',
    latitude: '25.0',
    siteid: '1',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getAqi ──────────────────────────────────────────

describe('getAqi', () => {
  it('returns all stations when no filter', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: '松山', county: '臺北市' }),
      makeStation({ sitename: '左營', county: '高雄市' }),
    ]);

    const result = await getAqi(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('松山');
    expect(result.content[0].text).toContain('左營');
  });

  it('filters by county', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: '松山', county: '臺北市' }),
      makeStation({ sitename: '左營', county: '高雄市' }),
    ]);

    const result = await getAqi(env, { county: '臺北市' });
    expect(result.content[0].text).toContain('松山');
    expect(result.content[0].text).not.toContain('左營');
  });

  it('filters by station name', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: '松山' }),
      makeStation({ sitename: '中山' }),
    ]);

    const result = await getAqi(env, { station: '中山' });
    expect(result.content[0].text).toContain('中山');
    expect(result.content[0].text).not.toContain('松山');
  });

  it('returns message when no data found', async () => {
    mockFetchAqiData.mockResolvedValueOnce([]);

    const result = await getAqi(env, { county: '不存在市' });
    expect(result.content[0].text).toContain('找不到');
    expect(result.content[0].text).toContain('不存在市');
  });

  it('handles API error', async () => {
    mockFetchAqiData.mockRejectedValueOnce(new Error('API down'));

    const result = await getAqi(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// ─── getStationDetail ────────────────────────────────

describe('getStationDetail', () => {
  it('returns detailed data for a station', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: '松山', aqi: '50', 'pm2.5': '12', o3: '30' }),
    ]);

    const result = await getStationDetail(env, { station: '松山' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('松山');
    expect(result.content[0].text).toContain('PM2.5: 12');
    expect(result.content[0].text).toContain('O3:    30');
    expect(result.content[0].text).toContain('污染物濃度');
  });

  it('returns error when station param missing', async () => {
    const result = await getStationDetail(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供測站名稱');
  });

  it('returns message when station not found', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: '松山' }),
    ]);

    const result = await getStationDetail(env, { station: '不存在站' });
    expect(result.content[0].text).toContain('找不到測站');
    expect(result.content[0].text).toContain('不存在站');
  });

  it('handles API error', async () => {
    mockFetchAqiData.mockRejectedValueOnce(new Error('timeout'));

    const result = await getStationDetail(env, { station: '松山' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// ─── getPm25Ranking ──────────────────────────────────

describe('getPm25Ranking', () => {
  it('returns stations sorted by PM2.5 descending', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: '板橋', 'pm2.5': '10', aqi: '40' }),
      makeStation({ sitename: '左營', 'pm2.5': '50', aqi: '120' }),
      makeStation({ sitename: '豐原', 'pm2.5': '30', aqi: '80' }),
    ]);

    const result = await getPm25Ranking(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // 左營(50) > 豐原(30) > 板橋(10)
    expect(text.indexOf('左營')).toBeLessThan(text.indexOf('豐原'));
    expect(text.indexOf('豐原')).toBeLessThan(text.indexOf('板橋'));
  });

  it('respects limit parameter', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: 'A', 'pm2.5': '10' }),
      makeStation({ sitename: 'B', 'pm2.5': '50' }),
      makeStation({ sitename: 'C', 'pm2.5': '30' }),
    ]);

    const result = await getPm25Ranking(env, { limit: 2 });
    const text = result.content[0].text;
    expect(text).toContain('前 2 名');
    expect(text).toContain('B');
    expect(text).toContain('C');
    expect(text).not.toContain('1. A'); // A should not be in top 2
  });

  it('skips stations with invalid PM2.5', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: 'A', 'pm2.5': '' }),
      makeStation({ sitename: 'B', 'pm2.5': '-' }),
      makeStation({ sitename: 'C', 'pm2.5': '30' }),
    ]);

    const result = await getPm25Ranking(env, {});
    const text = result.content[0].text;
    expect(text).toContain('C');
    expect(text).toContain('前 1 名');
  });

  it('handles empty data', async () => {
    mockFetchAqiData.mockResolvedValueOnce([]);

    const result = await getPm25Ranking(env, {});
    expect(result.content[0].text).toContain('無可用 PM2.5');
  });

  it('handles API error', async () => {
    mockFetchAqiData.mockRejectedValueOnce(new Error('fail'));

    const result = await getPm25Ranking(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fail');
  });
});

// ─── getUnhealthyStations ────────────────────────────

describe('getUnhealthyStations', () => {
  it('returns stations with AQI above threshold', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: 'A', aqi: '50', status: '良好' }),
      makeStation({ sitename: 'B', aqi: '150', status: '對敏感族群不健康', pollutant: 'PM2.5' }),
      makeStation({ sitename: 'C', aqi: '120', status: '對敏感族群不健康', pollutant: 'O3' }),
    ]);

    const result = await getUnhealthyStations(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('B');
    expect(text).toContain('C');
    expect(text).not.toContain('1. A'); // A is below threshold
    // B (150) should come before C (120)
    expect(text.indexOf('B')).toBeLessThan(text.indexOf('C'));
  });

  it('uses custom threshold', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: 'A', aqi: '50' }),
      makeStation({ sitename: 'B', aqi: '80' }),
    ]);

    const result = await getUnhealthyStations(env, { threshold: 60 });
    const text = result.content[0].text;
    expect(text).toContain('超過 60');
    expect(text).toContain('B');
  });

  it('returns all-clear message when none exceed threshold', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ sitename: 'A', aqi: '30' }),
      makeStation({ sitename: 'B', aqi: '40' }),
    ]);

    const result = await getUnhealthyStations(env, {});
    expect(result.content[0].text).toContain('空氣品質良好');
  });

  it('handles API error', async () => {
    mockFetchAqiData.mockRejectedValueOnce(new Error('network'));

    const result = await getUnhealthyStations(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network');
  });
});

// ─── getCountySummary ────────────────────────────────

describe('getCountySummary', () => {
  it('returns county averages sorted by AQI descending', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ county: '臺北市', aqi: '40' }),
      makeStation({ county: '臺北市', aqi: '60' }),
      makeStation({ county: '高雄市', aqi: '100' }),
      makeStation({ county: '高雄市', aqi: '120' }),
    ]);

    const result = await getCountySummary(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // 高雄 avg=110 should come before 臺北 avg=50
    expect(text.indexOf('高雄市')).toBeLessThan(text.indexOf('臺北市'));
    expect(text).toContain('平均 AQI: 110');
    expect(text).toContain('平均 AQI: 50');
    expect(text).toContain('2 站');
  });

  it('skips stations with invalid AQI', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      makeStation({ county: '臺北市', aqi: '' }),
      makeStation({ county: '臺北市', aqi: '40' }),
    ]);

    const result = await getCountySummary(env, {});
    const text = result.content[0].text;
    expect(text).toContain('1 站'); // only 1 valid station
  });

  it('handles empty data', async () => {
    mockFetchAqiData.mockResolvedValueOnce([]);

    const result = await getCountySummary(env, {});
    expect(result.content[0].text).toContain('無可用 AQI');
  });

  it('handles API error', async () => {
    mockFetchAqiData.mockRejectedValueOnce(new Error('down'));

    const result = await getCountySummary(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('down');
  });
});
