import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildUrl,
  getAccessToken,
  fetchEndpoint,
  resetTokenCache,
  isValidCity,
  VALID_CITIES,
} from '../src/client.js';
import type { Env } from '../src/types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env: Env = {
  TDX_CLIENT_ID: 'test-client-id',
  TDX_CLIENT_SECRET: 'test-client-secret',
  SERVER_NAME: 'taiwan-parking',
  SERVER_VERSION: '1.0.0',
};

describe('buildUrl', () => {
  it('constructs correct URL with endpoint and $format=JSON', () => {
    const url = buildUrl('/OffStreet/CarPark/City/Taipei');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://tdx.transportdata.tw/api/basic/v2/Parking/OffStreet/CarPark/City/Taipei'
    );
    expect(parsed.searchParams.get('$format')).toBe('JSON');
  });

  it('appends additional params', () => {
    const url = buildUrl('/OffStreet/CarPark/City/Taipei', { $top: '10' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$top')).toBe('10');
  });

  it('handles multiple parameters', () => {
    const url = buildUrl('/OffStreet/CarPark/City/Taipei', {
      $top: '30',
      $filter: "contains(CarParkName/Zh_tw, '停車')",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$format')).toBe('JSON');
    expect(parsed.searchParams.get('$top')).toBe('30');
    expect(parsed.searchParams.get('$filter')).toContain('停車');
  });

  it('works without params', () => {
    const url = buildUrl('/OffStreet/ParkingAvailability/City/Taipei');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$format')).toBe('JSON');
    expect(parsed.searchParams.has('$top')).toBe(false);
  });
});

describe('getAccessToken', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetTokenCache();
  });

  it('fetches a new token from TDX', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'my-token-123',
        expires_in: 86400,
        token_type: 'Bearer',
      }),
    });

    const token = await getAccessToken('client-id', 'client-secret');
    expect(token).toBe('my-token-123');
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('returns cached token on second call', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'cached-token',
        expires_in: 86400,
        token_type: 'Bearer',
      }),
    });

    const token1 = await getAccessToken('client-id', 'client-secret');
    const token2 = await getAccessToken('client-id', 'client-secret');
    expect(token1).toBe('cached-token');
    expect(token2).toBe('cached-token');
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('throws on non-200 token response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(getAccessToken('bad-id', 'bad-secret')).rejects.toThrow(
      'TDX token error: 401 Unauthorized'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getAccessToken('id', 'secret')).rejects.toThrow('Network error');
  });
});

describe('fetchEndpoint', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetTokenCache();
  });

  it('fetches data with auth header', async () => {
    // First call: token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'bearer-token',
        expires_in: 86400,
        token_type: 'Bearer',
      }),
    });
    // Second call: API data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ CarParkID: 'P001', CarParkName: { Zh_tw: '台北車站停車場', En: 'Taipei Station' } }],
    });

    const result = await fetchEndpoint(env, '/OffStreet/CarPark/City/Taipei');
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Verify auth header
    const apiCall = mockFetch.mock.calls[1];
    expect(apiCall[1].headers.Authorization).toBe('Bearer bearer-token');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'token',
        expires_in: 86400,
        token_type: 'Bearer',
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      fetchEndpoint(env, '/OffStreet/CarPark/City/InvalidCity')
    ).rejects.toThrow('TDX API error: 404 Not Found');
  });
});

describe('isValidCity', () => {
  it('accepts valid city codes', () => {
    expect(isValidCity('Taipei')).toBe(true);
    expect(isValidCity('NewTaipei')).toBe(true);
    expect(isValidCity('Taichung')).toBe(true);
    expect(isValidCity('Kaohsiung')).toBe(true);
    expect(isValidCity('Taoyuan')).toBe(true);
  });

  it('rejects invalid city codes', () => {
    expect(isValidCity('taipei')).toBe(false);
    expect(isValidCity('Hsinchu')).toBe(false);
    expect(isValidCity('')).toBe(false);
    expect(isValidCity('InvalidCity')).toBe(false);
  });
});

describe('VALID_CITIES', () => {
  it('contains 5 cities', () => {
    expect(VALID_CITIES).toHaveLength(5);
  });
});
