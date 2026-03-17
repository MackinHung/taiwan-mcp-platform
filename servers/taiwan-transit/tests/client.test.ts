import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchEndpoint, getAccessToken, resetTokenCache } from '../src/client.js';
import type { Env } from '../src/types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env: Env = {
  TDX_CLIENT_ID: 'test-client-id',
  TDX_CLIENT_SECRET: 'test-client-secret',
  SERVER_NAME: 'taiwan-transit',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetch.mockReset();
  resetTokenCache();
});

describe('buildUrl', () => {
  it('constructs correct URL with endpoint and $format=JSON', () => {
    const url = buildUrl('/Rail/TRA/LiveBoard');
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://tdx.transportdata.tw');
    expect(parsed.pathname).toBe('/api/basic/v2/Rail/TRA/LiveBoard');
    expect(parsed.searchParams.get('$format')).toBe('JSON');
  });

  it('appends additional query parameters', () => {
    const url = buildUrl('/Rail/TRA/LiveBoard', { '$top': '20' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$format')).toBe('JSON');
    expect(parsed.searchParams.get('$top')).toBe('20');
  });

  it('handles multiple parameters', () => {
    const url = buildUrl('/Rail/TRA/LiveBoard', { '$top': '10', '$filter': 'StationID eq 1000' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$top')).toBe('10');
    expect(parsed.searchParams.get('$filter')).toBe('StationID eq 1000');
  });

  it('handles empty params object', () => {
    const url = buildUrl('/Rail/TRA/LiveBoard', {});
    const parsed = new URL(url);
    expect(parsed.searchParams.get('$format')).toBe('JSON');
    // Only $format should be present
    expect([...parsed.searchParams.keys()]).toEqual(['$format']);
  });
});

describe('getAccessToken', () => {
  it('sends correct token request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'abc123', expires_in: 3600, token_type: 'Bearer' }),
    });

    const token = await getAccessToken('my-id', 'my-secret');
    expect(token).toBe('abc123');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(opts.body).toContain('grant_type=client_credentials');
    expect(opts.body).toContain('client_id=my-id');
    expect(opts.body).toContain('client_secret=my-secret');
  });

  it('caches token on subsequent calls', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'cached-token', expires_in: 3600, token_type: 'Bearer' }),
    });

    const token1 = await getAccessToken('id', 'secret');
    const token2 = await getAccessToken('id', 'secret');

    expect(token1).toBe('cached-token');
    expect(token2).toBe('cached-token');
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('refreshes token after resetTokenCache', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'first', expires_in: 3600, token_type: 'Bearer' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'second', expires_in: 3600, token_type: 'Bearer' }),
      });

    const token1 = await getAccessToken('id', 'secret');
    expect(token1).toBe('first');

    resetTokenCache();
    const token2 = await getAccessToken('id', 'secret');
    expect(token2).toBe('second');
    expect(mockFetch).toHaveBeenCalledTimes(2);
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
});

describe('fetchEndpoint', () => {
  it('sends Bearer token in Authorization header', async () => {
    // First call: token request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'my-token', expires_in: 3600, token_type: 'Bearer' }),
    });
    // Second call: API request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ data: 'test' }],
    });

    await fetchEndpoint(env, '/Rail/TRA/LiveBoard');

    const [, apiOpts] = mockFetch.mock.calls[1];
    expect(apiOpts.headers.Authorization).toBe('Bearer my-token');
  });

  it('returns parsed JSON data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600, token_type: 'Bearer' }),
    });
    const mockData = [{ TrainNo: '123' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchEndpoint(env, '/Rail/TRA/LiveBoard');
    expect(result).toEqual(mockData);
  });

  it('throws on API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600, token_type: 'Bearer' }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchEndpoint(env, '/Rail/TRA/Invalid')).rejects.toThrow(
      'TDX API error: 404 Not Found'
    );
  });

  it('throws on network error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600, token_type: 'Bearer' }),
    });
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchEndpoint(env, '/Rail/TRA/LiveBoard')).rejects.toThrow('Network error');
  });

  it('passes params to buildUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600, token_type: 'Bearer' }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchEndpoint(env, '/Rail/TRA/LiveBoard', { '$top': '10' });

    const [apiUrl] = mockFetch.mock.calls[1];
    const parsed = new URL(apiUrl);
    expect(parsed.searchParams.get('$top')).toBe('10');
    expect(parsed.searchParams.get('$format')).toBe('JSON');
  });
});
