import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxyToolCall } from '../src/proxy.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('proxyToolCall', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('forwards tools/call request to upstream server', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ type: 'text', text: 'weather data' }] },
      }),
    });

    const result = await proxyToolCall({
      endpointUrl: 'https://weather.example.com',
      toolName: 'get_forecast',
      args: { city: 'Taipei' },
      requestId: 1,
    });

    expect(result.content[0].text).toBe('weather data');
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://weather.example.com');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.method).toBe('tools/call');
    expect(body.params.name).toBe('get_forecast');
    expect(body.params.arguments.city).toBe('Taipei');
  });

  it('handles upstream error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32601, message: 'Tool not found' },
      }),
    });

    const result = await proxyToolCall({
      endpointUrl: 'https://weather.example.com',
      toolName: 'nonexistent',
      args: {},
      requestId: 1,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Tool not found');
  });

  it('handles network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await proxyToolCall({
      endpointUrl: 'https://dead-server.example.com',
      toolName: 'get_data',
      args: {},
      requestId: 1,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Connection refused');
  });

  it('handles non-200 HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    });

    const result = await proxyToolCall({
      endpointUrl: 'https://broken.example.com',
      toolName: 'get_data',
      args: {},
      requestId: 1,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('502');
  });

  it('sends correct Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ type: 'text', text: 'ok' }] },
      }),
    });

    await proxyToolCall({
      endpointUrl: 'https://weather.example.com',
      toolName: 'get_forecast',
      args: {},
      requestId: 1,
    });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Content-Type']).toBe('application/json');
  });
});
