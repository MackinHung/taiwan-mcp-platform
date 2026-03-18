import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMcpRequest } from '../src/mcp-handler.js';
import type { CompositionConfig, McpRequest } from '../src/types.js';
import * as permLogger from '../src/permission-logger.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const logSpy = vi.spyOn(permLogger, 'logPermissionViolations');

function makeComposition(overrides: Partial<CompositionConfig> = {}): CompositionConfig {
  return {
    id: 'comp-1',
    user_id: 'user-1',
    name: 'Test Composition',
    endpoint_slug: 'test',
    is_active: true,
    servers: [
      {
        server_id: 'srv-1',
        server_slug: 'weather',
        server_name: 'Weather',
        namespace_prefix: 'weather',
        endpoint_url: 'https://weather.example.com',
        enabled: true,
        pinned_version: null,
        declared_permissions: 'readonly',
        declared_external_urls: ['https://api.weather.gov'],
      },
    ],
    ...overrides,
  };
}

function makeToolCallRequest(toolName: string, args: Record<string, unknown> = {}): McpRequest {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  };
}

describe('mcp-handler permission integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    logSpy.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ type: 'text', text: 'ok' }] },
      }),
    });
  });

  it('logs violation for write tool on readonly server but still proxies', async () => {
    const composition = makeComposition();
    const request = makeToolCallRequest('weather.delete_record');
    const result = await handleMcpRequest(composition, request);

    expect(logSpy).toHaveBeenCalledOnce();
    const violations = logSpy.mock.calls[0][0];
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('write_on_readonly');

    // Still proxies (soft enforcement)
    expect(result.result).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('no violations for read tool on readonly server', async () => {
    const composition = makeComposition();
    const request = makeToolCallRequest('weather.get_forecast');
    await handleMcpRequest(composition, request);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('skips permission check when declared_permissions is not set', async () => {
    const composition = makeComposition({
      servers: [
        {
          server_id: 'srv-2',
          server_slug: 'stock',
          server_name: 'Stock',
          namespace_prefix: 'stock',
          endpoint_url: 'https://stock.example.com',
          enabled: true,
          pinned_version: null,
        },
      ],
    });
    const request = makeToolCallRequest('stock.delete_record');
    await handleMcpRequest(composition, request);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs undeclared URL violations in args', async () => {
    const composition = makeComposition();
    const request = makeToolCallRequest('weather.get_data', {
      url: 'https://evil.com/steal',
    });
    await handleMcpRequest(composition, request);

    expect(logSpy).toHaveBeenCalledOnce();
    const violations = logSpy.mock.calls[0][0];
    expect(violations.some((v: any) => v.type === 'undeclared_url_in_args')).toBe(true);
  });
});
