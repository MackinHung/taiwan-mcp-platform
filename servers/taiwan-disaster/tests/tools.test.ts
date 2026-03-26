import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchAllAlerts: vi.fn(),
  fetchAlerts: vi.fn(),
  buildAlertUrl: vi.fn(),
}));

import { fetchAllAlerts } from '../src/client.js';
import { getActiveAlerts } from '../src/tools/active-alerts.js';
import { getAlertsByType } from '../src/tools/alerts-by-type.js';
import { getAlertsByRegion } from '../src/tools/alerts-by-region.js';
import { getEarthquakeReports } from '../src/tools/earthquake.js';
import { getAlertHistory } from '../src/tools/alert-history.js';
import type { Env } from '../src/types.js';

const mockFetchAllAlerts = vi.mocked(fetchAllAlerts);

const env: Env = {
  SERVER_NAME: 'taiwan-disaster',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchAllAlerts.mockReset();
});

// Use dynamic dates so tests don't break after 7 days
const today = new Date();
const hoursAgo = (h: number) => new Date(today.getTime() - h * 3600_000).toISOString().slice(0, 19);

const sampleAlerts = [
  {
    alertId: 'A001',
    alertType: 'earthquake',
    alertTypeName: '地震',
    severity: 'moderate',
    area: '花蓮縣',
    description: '花蓮近海發生規模5.2地震',
    sender: '中央氣象署',
    effective: hoursAgo(2),
    expires: hoursAgo(0),
    magnitude: '5.2',
    depth: '15',
    epicenter: '花蓮近海',
    updateTime: hoursAgo(2),
  },
  {
    alertId: 'A002',
    alertType: 'heavy_rain',
    alertTypeName: '豪雨',
    severity: 'severe',
    area: '臺北市',
    description: '臺北市發布豪雨特報',
    sender: '中央氣象署',
    effective: hoursAgo(4),
    expires: hoursAgo(0),
    magnitude: '',
    depth: '',
    epicenter: '',
    updateTime: hoursAgo(4),
  },
  {
    alertId: 'A003',
    alertType: 'landslide',
    alertTypeName: '土石流',
    severity: 'warning',
    area: '新北市',
    description: '新北市烏來區土石流警戒',
    sender: '水土保持署',
    effective: hoursAgo(24),
    expires: hoursAgo(12),
    magnitude: '',
    depth: '',
    epicenter: '',
    updateTime: hoursAgo(24),
  },
];

// --- getActiveAlerts ---
describe('getActiveAlerts', () => {
  it('returns all active alerts', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getActiveAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('地震');
    expect(result.content[0].text).toContain('豪雨');
    expect(result.content[0].text).toContain('生效中警報');
    expect(result.content[0].text).toContain('顯示 3 則');
  });

  it('respects limit parameter', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getActiveAlerts(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 則');
  });

  it('handles empty results', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({ alerts: [], total: 0 });
    const result = await getActiveAlerts(env, {});
    expect(result.content[0].text).toContain('目前無生效中的警報');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllAlerts.mockRejectedValueOnce(new Error('API down'));
    const result = await getActiveAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- getAlertsByType ---
describe('getAlertsByType', () => {
  it('filters alerts by type', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertsByType(env, { alertType: 'earthquake' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('地震');
    expect(result.content[0].text).not.toContain('豪雨');
  });

  it('returns error when alertType is empty', async () => {
    const result = await getAlertsByType(env, { alertType: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供警報類型');
  });

  it('returns error when alertType is missing', async () => {
    const result = await getAlertsByType(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供警報類型');
  });

  it('returns error for invalid alert type', async () => {
    const result = await getAlertsByType(env, { alertType: 'invalid_type' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的警報類型');
    expect(result.content[0].text).toContain('earthquake');
  });

  it('handles no matching alerts', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: [sampleAlerts[1]], // only heavy_rain
      total: 1,
    });
    const result = await getAlertsByType(env, { alertType: 'typhoon' });
    expect(result.content[0].text).toContain('目前無「颱風」相關警報');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllAlerts.mockRejectedValueOnce(new Error('timeout'));
    const result = await getAlertsByType(env, { alertType: 'earthquake' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- getAlertsByRegion ---
describe('getAlertsByRegion', () => {
  it('filters alerts by region', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertsByRegion(env, { region: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('豪雨');
  });

  it('returns error when region is empty', async () => {
    const result = await getAlertsByRegion(env, { region: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市或地區名稱');
  });

  it('returns error when region is missing', async () => {
    const result = await getAlertsByRegion(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供縣市或地區名稱');
  });

  it('handles no matching alerts', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertsByRegion(env, { region: '金門縣' });
    expect(result.content[0].text).toContain('「金門縣」目前無相關警報');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllAlerts.mockRejectedValueOnce(new Error('server error'));
    const result = await getAlertsByRegion(env, { region: '臺北市' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- getEarthquakeReports ---
describe('getEarthquakeReports', () => {
  it('returns earthquake reports', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getEarthquakeReports(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('地震報告');
    expect(result.content[0].text).toContain('5.2');
    expect(result.content[0].text).toContain('花蓮');
  });

  it('filters by minimum magnitude', async () => {
    const alertsWithMagnitudes = [
      { ...sampleAlerts[0], magnitude: '3.0', alertTypeName: '地震' },
      { ...sampleAlerts[0], alertId: 'A005', magnitude: '6.5', alertTypeName: '地震' },
    ];
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: alertsWithMagnitudes,
      total: 2,
    });
    const result = await getEarthquakeReports(env, { minMagnitude: 5 });
    expect(result.content[0].text).toContain('6.5');
    expect(result.content[0].text).not.toContain('規模: 3.0');
  });

  it('handles no earthquake reports', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: [sampleAlerts[1]], // only heavy_rain
      total: 1,
    });
    const result = await getEarthquakeReports(env, {});
    expect(result.content[0].text).toContain('目前無');
    expect(result.content[0].text).toContain('地震報告');
  });

  it('respects limit parameter', async () => {
    const manyEarthquakes = Array.from({ length: 20 }, (_, i) => ({
      ...sampleAlerts[0],
      alertId: `EQ${i}`,
      magnitude: String(3 + i * 0.1),
    }));
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: manyEarthquakes,
      total: 20,
    });
    const result = await getEarthquakeReports(env, { limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 則');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllAlerts.mockRejectedValueOnce(new Error('db error'));
    const result = await getEarthquakeReports(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});

// --- getAlertHistory ---
describe('getAlertHistory', () => {
  it('returns all history within days range', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertHistory(env, { days: 7 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('近 7 天');
    expect(result.content[0].text).toContain('歷史警報');
  });

  it('filters by alert type', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertHistory(env, {
      alertType: 'heavy_rain',
      days: 7,
    });
    expect(result.content[0].text).toContain('豪雨');
  });

  it('handles no results for time range', async () => {
    const oldAlerts = sampleAlerts.map((a) => ({
      ...a,
      effective: '2020-01-01T00:00:00',
      updateTime: '2020-01-01T00:00:00',
    }));
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: oldAlerts,
      total: 3,
    });
    const result = await getAlertHistory(env, { days: 1 });
    expect(result.content[0].text).toContain('近 1 天無');
  });

  it('uses default 7 days when not specified', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertHistory(env, {});
    expect(result.content[0].text).toContain('近 7 天');
  });

  it('respects limit parameter', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: sampleAlerts,
      total: 3,
    });
    const result = await getAlertHistory(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 則');
  });

  it('handles API error gracefully', async () => {
    mockFetchAllAlerts.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getAlertHistory(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});
