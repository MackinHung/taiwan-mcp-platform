import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxyToServer } from '../src/proxy.js';
import type { CompositionServerEntry } from '../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeServer(overrides: Partial<CompositionServerEntry> = {}): CompositionServerEntry {
  return {
    server_id: 'srv-001',
    server_slug: 'weather',
    server_name: '天氣',
    namespace_prefix: 'weather',
    endpoint_url: 'https://weather.example.com',
    enabled: true,
    pinned_version: null,
    ...overrides,
  };
}

describe('proxyToServer', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends correct JSON-RPC to endpoint_url', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ type: 'text', text: 'data' }] },
      }),
    });

    await proxyToServer(makeServer(), 'get_forecast', { city: 'Taipei' }, 1);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://weather.example.com');
    const body = JSON.parse(opts.body);
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('tools/call');
  });

  it('includes correct tool name (without namespace prefix)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: {} }),
    });

    await proxyToServer(makeServer(), 'get_forecast', {}, 1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.params.name).toBe('get_forecast');
  });

  it('passes arguments through correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: {} }),
    });

    const args = { city: 'Taipei', days: 3 };
    await proxyToServer(makeServer(), 'get_forecast', args, 1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.params.arguments).toEqual({ city: 'Taipei', days: 3 });
  });

  it('returns parsed MCP response on success', async () => {
    const mockResult = {
      jsonrpc: '2.0',
      id: 42,
      result: { content: [{ type: 'text', text: 'weather data' }] },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    const result = await proxyToServer(makeServer(), 'get_forecast', {}, 42);
    expect(result.jsonrpc).toBe('2.0');
    expect(result.id).toBe(42);
    expect(result.result).toEqual({ content: [{ type: 'text', text: 'weather data' }] });
  });

  it('handles server errors (non-200 status)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
    });

    const result = await proxyToServer(makeServer(), 'get_forecast', {}, 1);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32603);
    expect(result.error!.message).toContain('502');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await proxyToServer(makeServer(), 'get_forecast', {}, 1);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32603);
    expect(result.error!.message).toContain('Connection refused');
  });

  it('handles timeout (AbortError)', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await proxyToServer(makeServer(), 'get_forecast', {}, 1);
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('timeout');
  });

  it('handles server returning error in JSON-RPC', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32601, message: 'Method not found' },
      }),
    });

    const result = await proxyToServer(makeServer(), 'nonexistent', {}, 1);
    // Passes through the JSON-RPC error from upstream
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32601);
  });

  it('sends correct Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: {} }),
    });

    await proxyToServer(makeServer(), 'get_forecast', {}, 1);

    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('preserves requestId in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 99, result: {} }),
    });

    const result = await proxyToServer(makeServer(), 'get_forecast', {}, 99);
    expect(result.id).toBe(99);
  });
});
