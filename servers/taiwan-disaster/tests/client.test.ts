import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAlertUrl, fetchAlerts, fetchAllAlerts } from '../src/client.js';
import type { Env } from '../src/types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env: Env = {
  SERVER_NAME: 'taiwan-disaster',
  SERVER_VERSION: '1.0.0',
};

describe('buildAlertUrl', () => {
  it('constructs correct NCDR URL with endpoint', () => {
    const url = buildAlertUrl('AlertAll');
    expect(url).toBe('https://alerts.ncdr.nat.gov.tw/api/AlertAll');
  });

  it('appends api_key when provided', () => {
    const url = buildAlertUrl('AlertAll', { apiKey: 'test-key-123' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('api_key')).toBe('test-key-123');
  });

  it('omits api_key when not provided', () => {
    const url = buildAlertUrl('AlertByType');
    const parsed = new URL(url);
    expect(parsed.searchParams.has('api_key')).toBe(false);
  });

  it('handles different endpoints', () => {
    const url = buildAlertUrl('AlertByArea');
    expect(url).toContain('AlertByArea');
  });
});

describe('fetchAlerts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses array response and returns normalized alerts', async () => {
    const mockAlerts = [
      {
        AlertID: 'A001',
        AlertType: 'earthquake',
        AlertTypeName: '地震',
        Severity: 'moderate',
        Area: '花蓮縣',
        Description: '花蓮近海發生地震',
        Sender: '中央氣象署',
        Effective: '2026-03-18T08:00:00',
        Expires: '2026-03-18T10:00:00',
        Magnitude: '5.2',
        Depth: '15',
        Epicenter: '花蓮近海',
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts,
    });

    const result = await fetchAlerts(env, 'AlertAll');
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].alertId).toBe('A001');
    expect(result.alerts[0].alertType).toBe('earthquake');
    expect(result.alerts[0].alertTypeName).toBe('地震');
    expect(result.alerts[0].severity).toBe('moderate');
    expect(result.alerts[0].area).toBe('花蓮縣');
    expect(result.alerts[0].magnitude).toBe('5.2');
    expect(result.total).toBe(1);
  });

  it('parses object response with records array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            AlertID: 'A002',
            AlertTypeName: '豪雨',
            Area: '臺北市',
          },
        ],
        total: 1,
      }),
    });

    const result = await fetchAlerts(env, 'AlertAll');
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].alertId).toBe('A002');
    expect(result.alerts[0].alertTypeName).toBe('豪雨');
    expect(result.total).toBe(1);
  });

  it('parses object response with alerts array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          { alertId: 'A003', alertType: 'typhoon' },
        ],
      }),
    });

    const result = await fetchAlerts(env, 'AlertAll');
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].alertId).toBe('A003');
  });

  it('handles Chinese field names', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'A004',
          type: '颱風',
          severity: 'severe',
          location: '臺灣東部海面',
          headline: '颱風警報',
        },
      ],
    });

    const result = await fetchAlerts(env, 'AlertAll');
    expect(result.alerts[0].alertId).toBe('A004');
    expect(result.alerts[0].alertType).toBe('颱風');
    expect(result.alerts[0].area).toBe('臺灣東部海面');
    expect(result.alerts[0].description).toBe('颱風警報');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchAlerts(env, 'AlertAll')).rejects.toThrow(
      'NCDR API error: 500 Internal Server Error'
    );
  });

  it('throws on unexpected response format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => 'not an object or array',
    });

    await expect(fetchAlerts(env, 'AlertAll')).rejects.toThrow(
      'NCDR API returned unexpected response format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchAlerts(env, 'AlertAll')).rejects.toThrow('Network error');
  });

  it('passes API key from env', async () => {
    const envWithKey: Env = {
      ...env,
      NCDR_API_KEY: 'my-secret-key',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchAlerts(envWithKey, 'AlertAll');
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('api_key=my-secret-key');
  });
});

describe('fetchAllAlerts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls AlertAll endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchAllAlerts(env);
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('AlertAll');
  });
});
