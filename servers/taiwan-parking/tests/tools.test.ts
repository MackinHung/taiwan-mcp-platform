import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchEndpoint: vi.fn(),
  getAccessToken: vi.fn(),
  buildUrl: vi.fn(),
  resetTokenCache: vi.fn(),
  isValidCity: vi.fn((city: string) =>
    ['Taipei', 'NewTaipei', 'Taichung', 'Kaohsiung', 'Taoyuan'].includes(city)
  ),
  VALID_CITIES: ['Taipei', 'NewTaipei', 'Taichung', 'Kaohsiung', 'Taoyuan'],
}));

import { fetchEndpoint } from '../src/client.js';
import { searchParking } from '../src/tools/search-parking.js';
import { getRealtimeAvailability } from '../src/tools/realtime-availability.js';
import { getParkingRates } from '../src/tools/parking-rates.js';
import { searchNearbyParking } from '../src/tools/nearby-parking.js';
import { getParkingSummary } from '../src/tools/parking-summary.js';
import type { Env } from '../src/types.js';

const mockFetchEndpoint = vi.mocked(fetchEndpoint);

const env: Env = {
  TDX_CLIENT_ID: 'test-id',
  TDX_CLIENT_SECRET: 'test-secret',
  SERVER_NAME: 'taiwan-parking',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchEndpoint.mockReset();
});

// --- Search Parking ---
describe('searchParking', () => {
  const sampleCarParks = [
    {
      CarParkID: 'P001',
      CarParkName: { Zh_tw: '台北車站停車場', En: 'Taipei Station' },
      Address: '台北市中正區忠孝西路一段',
      TotalSpaces: 500,
      Telephone: '02-12345678',
      FareDescription: '每小時40元',
    },
  ];

  it('returns parking data for a valid city', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleCarParks);
    const result = await searchParking(env, { city: 'Taipei' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北車站停車場');
    expect(result.content[0].text).toContain('停車場搜尋結果');
  });

  it('passes keyword filter', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleCarParks);
    await searchParking(env, { city: 'Taipei', keyword: '台北車站' });
    expect(mockFetchEndpoint).toHaveBeenCalledWith(
      env,
      '/OffStreet/CarPark/City/Taipei',
      expect.objectContaining({
        $filter: "contains(CarParkName/Zh_tw, '台北車站')",
      })
    );
  });

  it('returns error for invalid city', async () => {
    const result = await searchParking(env, { city: 'InvalidCity' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供有效的城市代碼');
  });

  it('returns error when city is missing', async () => {
    const result = await searchParking(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles empty results', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await searchParking(env, { city: 'Taipei', keyword: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('API down'));
    const result = await searchParking(env, { city: 'Taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Realtime Availability ---
describe('getRealtimeAvailability', () => {
  const sampleAvailability = [
    {
      CarParkID: 'P001',
      CarParkName: { Zh_tw: '台北車站停車場', En: 'Taipei Station' },
      AvailableSpaces: 120,
      TotalSpaces: 500,
      DataCollectTime: '2026-03-18T14:30:00+08:00',
    },
  ];

  it('returns realtime availability data', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleAvailability);
    const result = await getRealtimeAvailability(env, { city: 'Taipei' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北車站停車場');
    expect(result.content[0].text).toContain('120');
    expect(result.content[0].text).toContain('即時停車空位');
  });

  it('passes parkingId filter', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleAvailability);
    await getRealtimeAvailability(env, { city: 'Taipei', parkingId: 'P001' });
    expect(mockFetchEndpoint).toHaveBeenCalledWith(
      env,
      '/OffStreet/ParkingAvailability/City/Taipei',
      expect.objectContaining({
        $filter: "CarParkID eq 'P001'",
      })
    );
  });

  it('returns error for invalid city', async () => {
    const result = await getRealtimeAvailability(env, { city: 'Invalid' });
    expect(result.isError).toBe(true);
  });

  it('handles empty results', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await getRealtimeAvailability(env, { city: 'Taipei' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('timeout'));
    const result = await getRealtimeAvailability(env, { city: 'Taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Parking Rates ---
describe('getParkingRates', () => {
  const sampleRates = [
    {
      CarParkID: 'P001',
      CarParkName: { Zh_tw: '台北車站停車場', En: 'Taipei Station' },
      TotalSpaces: 500,
      FareDescription: '每小時40元',
    },
  ];

  it('returns parking rates data', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleRates);
    const result = await getParkingRates(env, { city: 'Taipei' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('每小時40元');
    expect(result.content[0].text).toContain('停車場費率');
  });

  it('passes parkingId filter', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleRates);
    await getParkingRates(env, { city: 'Taipei', parkingId: 'P001' });
    expect(mockFetchEndpoint).toHaveBeenCalledWith(
      env,
      '/OffStreet/CarPark/City/Taipei',
      expect.objectContaining({
        $filter: "CarParkID eq 'P001'",
      })
    );
  });

  it('returns error for invalid city', async () => {
    const result = await getParkingRates(env, { city: 'BadCity' });
    expect(result.isError).toBe(true);
  });

  it('handles empty results', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await getParkingRates(env, { city: 'Taipei' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('server error'));
    const result = await getParkingRates(env, { city: 'Taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Nearby Parking ---
describe('searchNearbyParking', () => {
  const sampleNearby = [
    {
      CarParkID: 'P001',
      CarParkName: { Zh_tw: '台北車站停車場', En: 'Taipei Station' },
      Address: '台北市中正區',
      TotalSpaces: 500,
      CarParkPosition: { PositionLon: 121.517, PositionLat: 25.048 },
      FareDescription: '每小時40元',
    },
  ];

  it('returns nearby parking results', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleNearby);
    const result = await searchNearbyParking(env, {
      city: 'Taipei',
      latitude: 25.048,
      longitude: 121.517,
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北車站停車場');
    expect(result.content[0].text).toContain('附近');
  });

  it('uses custom radius', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleNearby);
    await searchNearbyParking(env, {
      city: 'Taipei',
      latitude: 25.048,
      longitude: 121.517,
      radius: 1000,
    });
    expect(mockFetchEndpoint).toHaveBeenCalledWith(
      env,
      '/OffStreet/CarPark/City/Taipei',
      expect.objectContaining({
        $spatialFilter: 'nearby(25.048, 121.517, 1000)',
      })
    );
  });

  it('returns error for invalid city', async () => {
    const result = await searchNearbyParking(env, {
      city: 'Invalid',
      latitude: 25.0,
      longitude: 121.5,
    });
    expect(result.isError).toBe(true);
  });

  it('returns error when latitude is missing', async () => {
    const result = await searchNearbyParking(env, {
      city: 'Taipei',
      longitude: 121.5,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('經緯度');
  });

  it('returns error when longitude is missing', async () => {
    const result = await searchNearbyParking(env, {
      city: 'Taipei',
      latitude: 25.0,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('經緯度');
  });

  it('returns error for out-of-range coordinates', async () => {
    const result = await searchNearbyParking(env, {
      city: 'Taipei',
      latitude: 100,
      longitude: 200,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('超出有效範圍');
  });

  it('handles empty results', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await searchNearbyParking(env, {
      city: 'Taipei',
      latitude: 25.0,
      longitude: 121.5,
    });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('network failure'));
    const result = await searchNearbyParking(env, {
      city: 'Taipei',
      latitude: 25.0,
      longitude: 121.5,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network failure');
  });
});

// --- Parking Summary ---
describe('getParkingSummary', () => {
  const sampleAvailability = [
    {
      CarParkID: 'P001',
      AvailableSpaces: 120,
      TotalSpaces: 500,
    },
    {
      CarParkID: 'P002',
      AvailableSpaces: 0,
      TotalSpaces: 200,
    },
    {
      CarParkID: 'P003',
      AvailableSpaces: 5,
      TotalSpaces: 100,
    },
  ];

  it('returns parking summary with statistics', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleAvailability);
    const result = await getParkingSummary(env, { city: 'Taipei' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('停車場數量: 3');
    expect(result.content[0].text).toContain('停車概況');
    expect(result.content[0].text).toContain('已滿停車場: 1');
  });

  it('returns error for invalid city', async () => {
    const result = await getParkingSummary(env, { city: 'Invalid' });
    expect(result.isError).toBe(true);
  });

  it('returns error when city is missing', async () => {
    const result = await getParkingSummary(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles empty results', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await getParkingSummary(env, { city: 'Taipei' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('db error'));
    const result = await getParkingSummary(env, { city: 'Taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});
