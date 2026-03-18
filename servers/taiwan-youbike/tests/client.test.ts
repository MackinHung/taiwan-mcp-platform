import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CITY_ENDPOINTS,
  VALID_CITIES,
  fetchStations,
  fetchAllStations,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const SAMPLE_TAIPEI_STATIONS = [
  {
    sno: '500101001',
    sna: 'YouBike2.0_捷運市政府站',
    snaen: 'YouBike2.0_MRT Taipei City Hall Sta.',
    tot: 50,
    sbi: 20,
    bemp: 30,
    lat: 25.0408,
    lng: 121.5676,
    ar: '忠孝東路五段',
    aren: 'Zhongxiao E. Rd.',
    sarea: '信義區',
    sareaen: 'Xinyi Dist.',
    act: 1,
    mday: '2026-03-18 10:00:00',
    srcUpdateTime: '2026-03-18 10:00:00',
    updateTime: '2026-03-18 10:00:00',
    infoTime: '2026-03-18 10:00:00',
    infoDate: '2026-03-18',
  },
];

describe('CITY_ENDPOINTS', () => {
  it('has endpoints for all 6 cities', () => {
    expect(Object.keys(CITY_ENDPOINTS)).toHaveLength(6);
    for (const city of VALID_CITIES) {
      expect(CITY_ENDPOINTS[city]).toBeDefined();
      expect(CITY_ENDPOINTS[city]).toMatch(/^https?:\/\//);
    }
  });
});

describe('fetchStations', () => {
  it('fetches and normalizes Taipei stations (array response)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_TAIPEI_STATIONS,
    });

    const stations = await fetchStations('taipei');
    expect(stations).toHaveLength(1);
    expect(stations[0].sna).toBe('YouBike2.0_捷運市政府站');
    expect(stations[0].sbi).toBe(20);
    expect(stations[0].bemp).toBe(30);
    expect(stations[0].lat).toBe(25.0408);
    expect(stations[0].sarea).toBe('信義區');
  });

  it('fetches and normalizes Taoyuan stations (nested result.records)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [
            {
              sno: '2001',
              sna: '桃園高鐵站',
              snaen: 'Taoyuan HSR',
              tot: 40,
              sbi: 15,
              bemp: 25,
              lat: 25.01,
              lng: 121.21,
              ar: '高鐵路',
              aren: 'HSR Rd',
              sarea: '中壢區',
              sareaen: 'Zhongli',
              act: 1,
              mday: '2026-03-18',
              srcUpdateTime: '',
              updateTime: '',
              infoTime: '',
              infoDate: '',
            },
          ],
        },
      }),
    });

    const stations = await fetchStations('taoyuan');
    expect(stations).toHaveLength(1);
    expect(stations[0].sna).toBe('桃園高鐵站');
    expect(stations[0].sarea).toBe('中壢區');
  });

  it('fetches and normalizes Kaohsiung stations (nested data)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSuccess: true,
        data: [
          {
            sno: '3001',
            sna: '高雄車站',
            snaen: 'Kaohsiung Station',
            tot: 30,
            sbi: 10,
            bemp: 20,
            lat: 22.63,
            lng: 120.30,
            ar: '站前路',
            aren: 'Station Rd',
            sarea: '三民區',
            sareaen: 'Sanmin',
            act: 1,
            mday: '',
            srcUpdateTime: '',
            updateTime: '',
            infoTime: '',
            infoDate: '',
          },
        ],
      }),
    });

    const stations = await fetchStations('kaohsiung');
    expect(stations).toHaveLength(1);
    expect(stations[0].sna).toBe('高雄車站');
  });

  it('normalizes stations with alternative field names', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          StationNo: '9001',
          StationName: '測試站',
          StationNameEn: 'Test Station',
          TotalDocks: 20,
          AvailableBikes: 5,
          EmptyDocks: 15,
          Latitude: 25.0,
          Longitude: 121.0,
          Address: '測試路',
          AddressEn: 'Test Rd',
          District: '測試區',
          DistrictEn: 'Test Dist',
          Active: 1,
          ModifyDate: '2026-03-18',
          SrcUpdateTime: '',
          UpdateTime: '',
          InfoTime: '',
          InfoDate: '',
        },
      ],
    });

    const stations = await fetchStations('taichung');
    expect(stations[0].sno).toBe('9001');
    expect(stations[0].sna).toBe('測試站');
    expect(stations[0].snaen).toBe('Test Station');
    expect(stations[0].tot).toBe(20);
    expect(stations[0].sbi).toBe(5);
    expect(stations[0].bemp).toBe(15);
    expect(stations[0].sarea).toBe('測試區');
  });

  it('handles missing fields with defaults', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{}],
    });

    const stations = await fetchStations('taipei');
    expect(stations).toHaveLength(1);
    expect(stations[0].sno).toBe('');
    expect(stations[0].sna).toBe('');
    expect(stations[0].tot).toBe(0);
    expect(stations[0].sbi).toBe(0);
    expect(stations[0].lat).toBe(0);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchStations('taipei')).rejects.toThrow('API 錯誤');
  });

  it('throws for unsupported city', async () => {
    await expect(fetchStations('unknown' as any)).rejects.toThrow('不支援的城市');
  });

  it('uses correct URL for each city', async () => {
    for (const city of VALID_CITIES) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      await fetchStations(city);
      const calledUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string;
      expect(calledUrl).toBe(CITY_ENDPOINTS[city]);
    }
  });
});

describe('fetchAllStations', () => {
  it('fetches all cities in parallel and returns results', async () => {
    // Mock 6 successful responses
    for (let i = 0; i < 6; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            sno: `${i}001`,
            sna: `站點${i}`,
            snaen: `Station${i}`,
            tot: 10,
            sbi: 5,
            bemp: 5,
            lat: 25.0,
            lng: 121.0,
            ar: '',
            aren: '',
            sarea: '',
            sareaen: '',
            act: 1,
            mday: '',
            srcUpdateTime: '',
            updateTime: '',
            infoTime: '',
            infoDate: '',
          },
        ],
      });
    }

    const results = await fetchAllStations();
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.city).toBeDefined();
      expect(r.stations).toHaveLength(1);
    }
  });

  it('handles partial failures gracefully', async () => {
    // First city succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_TAIPEI_STATIONS,
    });
    // Remaining 5 fail
    for (let i = 0; i < 5; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
    }

    const results = await fetchAllStations();
    expect(results).toHaveLength(6);
    // First should succeed
    expect(results[0].stations).toHaveLength(1);
    expect(results[0].error).toBeUndefined();
    // Rest should have errors
    for (let i = 1; i < 6; i++) {
      expect(results[i].stations).toHaveLength(0);
      expect(results[i].error).toBeDefined();
    }
  });

  it('returns empty stations array on failure with error message', async () => {
    for (let i = 0; i < 6; i++) {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
    }

    const results = await fetchAllStations();
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.stations).toHaveLength(0);
      expect(r.error).toContain('Network error');
    }
  });
});
