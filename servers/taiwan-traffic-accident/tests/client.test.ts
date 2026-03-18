import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchAccidents, ACCIDENT_RESOURCE_ID } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('buildUrl', () => {
  it('builds URL with resource ID', () => {
    const url = buildUrl('test-resource');
    expect(url).toContain('https://data.gov.tw/api/v2/rest/datastore/test-resource');
    expect(url).toContain('format=json');
  });

  it('includes limit parameter', () => {
    const url = buildUrl('test', { limit: 50 });
    expect(url).toContain('limit=50');
  });

  it('includes offset parameter', () => {
    const url = buildUrl('test', { offset: 10 });
    expect(url).toContain('offset=10');
  });

  it('includes filters as JSON', () => {
    const url = buildUrl('test', { filters: { '發生縣市': '臺北市' } });
    expect(url).toContain('filters=');
    expect(decodeURIComponent(url)).toContain('發生縣市');
  });

  it('omits limit when not provided', () => {
    const url = buildUrl('test');
    expect(url).not.toContain('limit=');
  });

  it('omits offset when not provided', () => {
    const url = buildUrl('test');
    expect(url).not.toContain('offset=');
  });
});

describe('fetchAccidents', () => {
  const sampleApiResponse = {
    success: true,
    result: {
      resource_id: ACCIDENT_RESOURCE_ID,
      fields: [],
      records: [
        {
          '發生日期': '2026/01/15',
          '發生時間': '08:30',
          '發生縣市': '臺北市',
          '發生市區鄉鎮': '中正區',
          '發生地點': '忠孝東路一段',
          '事故類型': 'A2',
          '死亡人數': '0',
          '受傷人數': '2',
          '當事者區分_車種': '機車-自小客',
          '天候': '晴',
          '路面狀況': '乾燥',
          '光線': '日間',
          '肇事原因': '未注意車前狀況',
        },
        {
          '發生日期': '2026/01/16',
          '發生時間': '14:00',
          '發生縣市': '新北市',
          '發生市區鄉鎮': '板橋區',
          '發生地點': '文化路二段',
          '事故類型': 'A2',
          '死亡人數': '0',
          '受傷人數': '1',
          '當事者區分_車種': '自小客',
          '天候': '雨',
          '路面狀況': '濕潤',
          '光線': '日間',
          '肇事原因': '未保持安全距離',
        },
      ],
      total: 2,
      limit: 100,
      offset: 0,
    },
  };

  it('fetches and normalizes accident records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleApiResponse,
    });

    const result = await fetchAccidents();
    expect(result.records).toHaveLength(2);
    expect(result.records[0].county).toBe('臺北市');
    expect(result.records[0].district).toBe('中正區');
    expect(result.records[0].deathCount).toBe(0);
    expect(result.records[0].injuryCount).toBe(2);
    expect(result.records[0].occurDate).toBe('2026/01/15');
  });

  it('maps Chinese field names to English properties', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleApiResponse,
    });

    const result = await fetchAccidents();
    const record = result.records[0];
    expect(record.occurTime).toBe('08:30');
    expect(record.address).toBe('忠孝東路一段');
    expect(record.accidentType).toBe('A2');
    expect(record.vehicleTypes).toBe('機車-自小客');
    expect(record.weatherCondition).toBe('晴');
    expect(record.roadCondition).toBe('乾燥');
    expect(record.lightCondition).toBe('日間');
    expect(record.cause).toBe('未注意車前狀況');
  });

  it('parses numeric fields correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [
            {
              '發生日期': '2026/01/15',
              '死亡人數': '3',
              '受傷人數': '5',
            },
          ],
          total: 1,
        },
      }),
    });

    const result = await fetchAccidents();
    expect(result.records[0].deathCount).toBe(3);
    expect(result.records[0].injuryCount).toBe(5);
  });

  it('handles missing fields with defaults', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [{}],
          total: 1,
        },
      }),
    });

    const result = await fetchAccidents();
    expect(result.records[0].occurDate).toBe('');
    expect(result.records[0].county).toBe('');
    expect(result.records[0].deathCount).toBe(0);
    expect(result.records[0].injuryCount).toBe(0);
  });

  it('returns empty records array when no data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    const result = await fetchAccidents();
    expect(result.records).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('passes county filter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAccidents({ county: '臺北市' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('發生縣市');
    expect(decodeURIComponent(calledUrl)).toContain('臺北市');
  });

  it('passes limit and offset to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAccidents({ limit: 50, offset: 20 });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=50');
    expect(calledUrl).toContain('offset=20');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchAccidents()).rejects.toThrow('Open Data API error');
  });

  it('throws on unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    await expect(fetchAccidents()).rejects.toThrow('unsuccessful');
  });

  it('uses correct resource ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAccidents();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain(ACCIDENT_RESOURCE_ID);
  });
});
