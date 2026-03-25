import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildWraUrl,
  buildSensorThingsUrl,
  fetchWraDataset,
  fetchSensorThings,
  WRA_DATASETS,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildWraUrl', () => {
  it('constructs correct URL with dataset ID and format=JSON', () => {
    const url = buildWraUrl('53564');
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://opendata.wra.gov.tw');
    expect(parsed.pathname).toBe('/api/v2/53564');
    expect(parsed.searchParams.get('format')).toBe('JSON');
  });

  it('appends query parameters', () => {
    const url = buildWraUrl('53564', { County: '臺北市' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('County')).toBe('臺北市');
    expect(parsed.searchParams.get('format')).toBe('JSON');
  });

  it('handles empty params', () => {
    const url = buildWraUrl('53564', {});
    const parsed = new URL(url);
    expect(parsed.searchParams.get('format')).toBe('JSON');
    // Only format param
    expect([...parsed.searchParams.keys()]).toEqual(['format']);
  });

  it('handles multiple parameters', () => {
    const url = buildWraUrl('53564', { County: '臺北市', Town: '信義區' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('County')).toBe('臺北市');
    expect(parsed.searchParams.get('Town')).toBe('信義區');
  });
});

describe('buildSensorThingsUrl', () => {
  it('constructs URL with primary endpoint by default', () => {
    const url = buildSensorThingsUrl('Datastreams');
    expect(url).toContain('sta.ci.taiwan.gov.tw');
    expect(url).toContain('/Datastreams');
  });

  it('accepts custom base URL', () => {
    const url = buildSensorThingsUrl('Observations', undefined, 'https://sta.colife.org.tw/FROST-Server/v1.0');
    expect(url).toContain('sta.colife.org.tw');
  });

  it('appends query parameters', () => {
    const url = buildSensorThingsUrl('Datastreams', { '$top': '10' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$top')).toBe('10');
  });
});

describe('fetchWraDataset', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns responseData from WRA API', async () => {
    const mockData = [{ ReservoirName: '石門水庫' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseCode: '200', responseMessage: 'OK', responseData: mockData }),
    });

    const result = await fetchWraDataset('45501');
    expect(result).toEqual(mockData);
  });

  it('returns empty array when responseData is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseCode: '200', responseMessage: 'OK' }),
    });

    const result = await fetchWraDataset('45501');
    expect(result).toEqual([]);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchWraDataset('45501')).rejects.toThrow('WRA API error: 500 Internal Server Error');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchWraDataset('45501')).rejects.toThrow('Network error');
  });

  it('passes abort signal for timeout', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseCode: '200', responseData: [] }),
    });

    await fetchWraDataset('45501');
    expect(mockFetch).toHaveBeenCalledOnce();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.signal).toBeDefined();
  });
});

describe('fetchSensorThings', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns value array from primary endpoint', async () => {
    const mockData = [{ '@iot.id': 1, name: 'Sensor1' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: mockData }),
    });

    const result = await fetchSensorThings('Datastreams');
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][0]).toContain('sta.ci.taiwan.gov.tw');
  });

  it('falls back to backup endpoint on primary failure', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Primary down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: [{ '@iot.id': 2 }] }),
      });

    const result = await fetchSensorThings('Datastreams');
    expect(result).toEqual([{ '@iot.id': 2 }]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toContain('sta.colife.org.tw');
  });

  it('throws primary error if both endpoints fail', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Primary down'))
      .mockRejectedValueOnce(new Error('Backup down'));

    await expect(fetchSensorThings('Datastreams')).rejects.toThrow('Primary down');
  });

  it('returns empty array when value is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchSensorThings('Datastreams');
    expect(result).toEqual([]);
  });

  it('throws on non-200 primary then falls back', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Unavailable' })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: [{ id: 1 }] }) });

    const result = await fetchSensorThings('Observations');
    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('WRA_DATASETS', () => {
  it('contains all 4 dataset IDs', () => {
    expect(Object.keys(WRA_DATASETS)).toHaveLength(4);
    expect(WRA_DATASETS.FLOOD_POTENTIAL).toBe('53564');
    expect(WRA_DATASETS.RESERVOIR).toBe('45501');
    expect(WRA_DATASETS.RIVER_LEVEL).toBe('25768');
    expect(WRA_DATASETS.RAINFALL).toBe('9177');
  });
});
