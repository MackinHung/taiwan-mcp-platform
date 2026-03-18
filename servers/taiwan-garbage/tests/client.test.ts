import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchRealtimeLocations,
  fetchSchedule,
  isValidCity,
  isGpsCity,
  getCityLabel,
  SUPPORTED_GPS_CITIES,
  ALL_SUPPORTED_CITIES,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// --- Utility functions ---
describe('isValidCity', () => {
  it('returns true for valid city codes', () => {
    expect(isValidCity('taipei')).toBe(true);
    expect(isValidCity('tainan')).toBe(true);
    expect(isValidCity('new_taipei')).toBe(true);
    expect(isValidCity('taoyuan')).toBe(true);
    expect(isValidCity('kaohsiung')).toBe(true);
    expect(isValidCity('taichung')).toBe(true);
  });

  it('returns false for invalid city codes', () => {
    expect(isValidCity('tokyo')).toBe(false);
    expect(isValidCity('')).toBe(false);
    expect(isValidCity('TAIPEI')).toBe(false);
  });
});

describe('isGpsCity', () => {
  it('returns true for GPS-capable cities', () => {
    expect(isGpsCity('tainan')).toBe(true);
    expect(isGpsCity('new_taipei')).toBe(true);
    expect(isGpsCity('taoyuan')).toBe(true);
    expect(isGpsCity('kaohsiung')).toBe(true);
    expect(isGpsCity('taichung')).toBe(true);
  });

  it('returns false for Taipei (schedule-only)', () => {
    expect(isGpsCity('taipei')).toBe(false);
  });
});

describe('getCityLabel', () => {
  it('returns Chinese labels for each city', () => {
    expect(getCityLabel('taipei')).toBe('台北市');
    expect(getCityLabel('tainan')).toBe('台南市');
    expect(getCityLabel('new_taipei')).toBe('新北市');
  });
});

describe('SUPPORTED_GPS_CITIES', () => {
  it('contains 5 cities (excludes Taipei)', () => {
    expect(SUPPORTED_GPS_CITIES).toHaveLength(5);
    expect(SUPPORTED_GPS_CITIES).not.toContain('taipei');
  });
});

describe('ALL_SUPPORTED_CITIES', () => {
  it('contains 6 cities (includes Taipei)', () => {
    expect(ALL_SUPPORTED_CITIES).toHaveLength(6);
    expect(ALL_SUPPORTED_CITIES).toContain('taipei');
  });
});

// --- fetchRealtimeLocations ---
describe('fetchRealtimeLocations', () => {
  const sampleGpsData = {
    records: [
      {
        car: 'ABC-1234',
        time: '2026-03-18 18:30:00',
        lng: '120.2133',
        lat: '22.9908',
        duty: '1',
        linename: '路線A',
        city: '台南市',
        area: '中西區',
      },
      {
        car: 'DEF-5678',
        time: '2026-03-18 18:31:00',
        lng: '121.5654',
        lat: '25.0330',
        duty: '1',
        linename: '路線B',
        city: '新北市',
        area: '板橋區',
      },
    ],
    total: 2,
  };

  it('fetches and normalizes GPS data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleGpsData,
    });

    const result = await fetchRealtimeLocations();
    expect(result).toHaveLength(2);
    expect(result[0].carNo).toBe('ABC-1234');
    expect(result[0].longitude).toBe(120.2133);
    expect(result[0].latitude).toBe(22.9908);
    expect(result[0].routeName).toBe('路線A');
  });

  it('filters by city when specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleGpsData,
    });

    const result = await fetchRealtimeLocations('tainan');
    expect(result).toHaveLength(1);
    expect(result[0].carNo).toBe('ABC-1234');
    expect(result[0].city).toBe('台南市');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchRealtimeLocations()).rejects.toThrow('GPS API error');
  });

  it('throws when records is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await expect(fetchRealtimeLocations()).rejects.toThrow('no records');
  });

  it('handles empty records array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [], total: 0 }),
    });

    const result = await fetchRealtimeLocations('tainan');
    expect(result).toHaveLength(0);
  });

  it('handles missing fields gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [{ car: '', time: '', lng: '', lat: '', duty: '', linename: '', city: '台南市', area: '' }],
        total: 1,
      }),
    });

    const result = await fetchRealtimeLocations('tainan');
    expect(result).toHaveLength(1);
    expect(result[0].carNo).toBe('');
    expect(result[0].longitude).toBe(0);
    expect(result[0].latitude).toBe(0);
  });
});

// --- fetchSchedule ---
describe('fetchSchedule', () => {
  describe('Taipei (data.taipei)', () => {
    it('fetches and normalizes Taipei schedule data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            results: [
              {
                '行政區': '中正區',
                '路線': '中正1',
                '星期': '一',
                '抵達時間': '18:30',
                '地點': '重慶南路一段',
              },
            ],
            count: 1,
          },
        }),
      });

      const result = await fetchSchedule('taipei');
      expect(result).toHaveLength(1);
      expect(result[0].area).toBe('中正區');
      expect(result[0].city).toBe('台北市');
      expect(result[0].scheduleDay).toBe('一');
    });

    it('filters by district for Taipei', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            results: [
              { '行政區': '中正區', '路線': 'A', '星期': '一', '抵達時間': '18:00', '地點': 'X' },
              { '行政區': '信義區', '路線': 'B', '星期': '二', '抵達時間': '19:00', '地點': 'Y' },
            ],
            count: 2,
          },
        }),
      });

      const result = await fetchSchedule('taipei', '中正');
      expect(result).toHaveLength(1);
      expect(result[0].area).toBe('中正區');
    });

    it('throws on Taipei API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(fetchSchedule('taipei')).rejects.toThrow('Taipei Schedule API error');
    });

    it('throws when Taipei results are missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: {} }),
      });

      await expect(fetchSchedule('taipei')).rejects.toThrow('no results');
    });
  });

  describe('Other cities (data.gov.tw)', () => {
    it('fetches and normalizes schedule data for non-Taipei cities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            records: [
              { area: '中西區', route: '路線1', day: '一', time: '18:00', address: '民族路' },
            ],
            total: 1,
          },
        }),
      });

      const result = await fetchSchedule('tainan');
      expect(result).toHaveLength(1);
      expect(result[0].area).toBe('中西區');
      expect(result[0].city).toBe('台南市');
    });

    it('throws on data.gov.tw API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchSchedule('tainan')).rejects.toThrow('Schedule API error');
    });

    it('throws on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      });

      await expect(fetchSchedule('tainan')).rejects.toThrow('unsuccessful');
    });

    it('returns empty array when no records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: { records: [], total: 0 },
        }),
      });

      const result = await fetchSchedule('tainan');
      expect(result).toHaveLength(0);
    });
  });
});
