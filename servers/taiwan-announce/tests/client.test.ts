import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiUrl, fetchAnnouncements } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const sampleAnnouncements = [
  {
    Index: 1,
    SendUnitName: '財政部',
    SendNo: '台財稅字第11300001號',
    Subject: '修正營業稅法施行細則',
    DocDate: '20240301',
    SendDate: '20240302',
    DueDate: '20240401',
  },
  {
    Index: 2,
    SendUnitName: '內政部',
    SendNo: '台內地字第11300002號',
    Subject: '都市計畫法令解釋',
    DocDate: '20240305',
    SendDate: '20240306',
    DueDate: '20240405',
  },
];

describe('getApiUrl', () => {
  it('returns the correct API URL', () => {
    const url = getApiUrl();
    expect(url).toBe('https://www.good.nat.gov.tw/odbbs/opendata/v1/json');
  });

  it('returns a string', () => {
    expect(typeof getApiUrl()).toBe('string');
  });

  it('starts with https', () => {
    expect(getApiUrl()).toMatch(/^https:\/\//);
  });
});

describe('fetchAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns announcement array on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAnnouncements,
    });

    const result = await fetchAnnouncements();
    expect(result).toHaveLength(2);
    expect(result[0].Subject).toBe('修正營業稅法施行細則');
    expect(result[1].SendUnitName).toBe('內政部');
  });

  it('calls the correct API URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchAnnouncements();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.good.nat.gov.tw/odbbs/opendata/v1/json'
    );
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchAnnouncements()).rejects.toThrow(
      '公告 API 錯誤: 500 Internal Server Error'
    );
  });

  it('throws on 404 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchAnnouncements()).rejects.toThrow(
      '公告 API 錯誤: 404 Not Found'
    );
  });

  it('returns empty array for non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const result = await fetchAnnouncements();
    expect(result).toEqual([]);
  });

  it('returns empty array for object response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'unexpected format' }),
    });

    const result = await fetchAnnouncements();
    expect(result).toEqual([]);
  });

  it('handles empty array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await fetchAnnouncements();
    expect(result).toHaveLength(0);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchAnnouncements()).rejects.toThrow('Network error');
  });

  it('returns all fields correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [sampleAnnouncements[0]],
    });

    const result = await fetchAnnouncements();
    expect(result[0]).toEqual({
      Index: 1,
      SendUnitName: '財政部',
      SendNo: '台財稅字第11300001號',
      Subject: '修正營業稅法施行細則',
      DocDate: '20240301',
      SendDate: '20240302',
      DueDate: '20240401',
    });
  });

  it('handles large response array', async () => {
    const large = Array.from({ length: 100 }, (_, i) => ({
      Index: i + 1,
      SendUnitName: `機關${i}`,
      SendNo: `字號${i}`,
      Subject: `公告${i}`,
      DocDate: '20240101',
      SendDate: '20240102',
      DueDate: '20240201',
    }));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => large,
    });

    const result = await fetchAnnouncements();
    expect(result).toHaveLength(100);
  });

  it('throws on 503 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchAnnouncements()).rejects.toThrow(
      '公告 API 錯誤: 503 Service Unavailable'
    );
  });
});
