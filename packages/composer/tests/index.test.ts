import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock proxy to avoid real HTTP calls
vi.mock('../src/proxy.js', () => ({
  proxyToServer: vi.fn().mockResolvedValue({
    jsonrpc: '2.0',
    id: 1,
    result: { content: [{ type: 'text', text: 'proxied result' }] },
  }),
}));

// Mock lazy-loader's loadAllTools for controlled test results
vi.mock('../src/lazy-loader.js', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    loadAllTools: vi.fn().mockResolvedValue([
      {
        name: 'weather.get_forecast',
        original_name: 'get_forecast',
        server_id: 'srv-001',
        namespace_prefix: 'weather',
        description: '[天氣] 取得天氣預報',
        inputSchema: { type: 'object', properties: { city: { type: 'string' } } },
      },
      {
        name: 'transit.get_arrivals',
        original_name: 'get_arrivals',
        server_id: 'srv-002',
        namespace_prefix: 'transit',
        description: '[交通] 取得到站資訊',
        inputSchema: { type: 'object', properties: {} },
      },
    ]),
  };
});

import { handleMcpRequest } from '../src/mcp-handler.js';
import type { CompositionConfig, McpRequest } from '../src/types.js';

// --- Fixtures ---

function makeComposition(overrides: Partial<CompositionConfig> = {}): CompositionConfig {
  return {
    id: 'comp-1',
    user_id: 'user-1',
    name: 'Test Composition',
    endpoint_slug: 'test-comp',
    is_active: true,
    servers: [
      {
        server_id: 'srv-001',
        server_slug: 'weather',
        server_name: '天氣',
        namespace_prefix: 'weather',
        endpoint_url: 'https://weather.example.com',
        enabled: true,
      },
      {
        server_id: 'srv-002',
        server_slug: 'transit',
        server_name: '交通',
        namespace_prefix: 'transit',
        endpoint_url: 'https://transit.example.com',
        enabled: true,
      },
    ],
    ...overrides,
  };
}

function makeRequest(overrides: Partial<McpRequest> = {}): McpRequest {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    ...overrides,
  };
}

// --- handleMcpRequest ---

describe('handleMcpRequest', () => {
  describe('initialize', () => {
    it('returns server info with protocolVersion', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({ method: 'initialize' })
      );
      expect(result.jsonrpc).toBe('2.0');
      expect((result.result as any).protocolVersion).toBe('2024-11-05');
    });

    it('returns server info with composition name', async () => {
      const result = await handleMcpRequest(
        makeComposition({ name: 'My Composition' }),
        makeRequest({ method: 'initialize' })
      );
      expect((result.result as any).serverInfo.name).toContain('My Composition');
    });

    it('returns capabilities with tools', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({ method: 'initialize' })
      );
      expect((result.result as any).capabilities).toHaveProperty('tools');
    });
  });

  describe('tools/list', () => {
    it('returns namespaced tools for mode A (<=5 servers)', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({ method: 'tools/list', id: 2 })
      );
      const tools = (result.result as any).tools;
      expect(tools.length).toBeGreaterThanOrEqual(2);
      const names = tools.map((t: any) => t.name);
      expect(names).toContain('weather.get_forecast');
      expect(names).toContain('transit.get_arrivals');
    });

    it('returns meta-tools for mode B (>5 servers)', async () => {
      const manyServers = Array.from({ length: 6 }, (_, i) => ({
        server_id: `srv-${i}`,
        server_slug: `s${i}`,
        server_name: `Server ${i}`,
        namespace_prefix: `s${i}`,
        endpoint_url: `https://s${i}.example.com`,
        enabled: true,
      }));
      const result = await handleMcpRequest(
        makeComposition({ servers: manyServers }),
        makeRequest({ method: 'tools/list', id: 3 })
      );
      const names = (result.result as any).tools.map((t: any) => t.name);
      expect(names).toContain('discover_tools');
      expect(names).toContain('execute_tool');
    });
  });

  describe('tools/call', () => {
    it('routes namespaced tool to correct upstream server', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({
          method: 'tools/call',
          id: 4,
          params: { name: 'weather.get_forecast', arguments: { city: 'Taipei' } },
        })
      );
      expect(result.result).toBeDefined();
      expect((result.result as any).content[0].text).toBe('proxied result');
    });

    it('returns error for unknown namespace', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({
          method: 'tools/call',
          id: 5,
          params: { name: 'unknown.tool', arguments: {} },
        })
      );
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32602);
    });

    it('returns error for non-namespaced tool', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({
          method: 'tools/call',
          id: 6,
          params: { name: 'get_forecast', arguments: {} },
        })
      );
      expect(result.error).toBeDefined();
    });

    it('handles discover_tools meta-tool (lazy mode)', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({
          method: 'tools/call',
          id: 7,
          params: { name: 'discover_tools', arguments: {} },
        })
      );
      expect(result.result).toBeDefined();
      const content = (result.result as any).content;
      expect(content[0].type).toBe('text');
      // Should be a JSON string listing tools
      const tools = JSON.parse(content[0].text);
      expect(Array.isArray(tools)).toBe(true);
    });

    it('handles execute_tool meta-tool', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({
          method: 'tools/call',
          id: 8,
          params: {
            name: 'execute_tool',
            arguments: { name: 'weather.get_forecast', arguments: { city: 'Taipei' } },
          },
        })
      );
      // Should proxy through to the upstream server
      expect(result.result).toBeDefined();
    });

    it('execute_tool returns error for invalid tool name', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({
          method: 'tools/call',
          id: 9,
          params: {
            name: 'execute_tool',
            arguments: { name: 'unknown.tool', arguments: {} },
          },
        })
      );
      expect(result.error).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({ method: 'unknown/method', id: 10 })
      );
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
    });

    it('preserves request id in error response', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({ method: 'unknown/method', id: 42 })
      );
      expect(result.id).toBe(42);
    });

    it('preserves request id in success response', async () => {
      const result = await handleMcpRequest(
        makeComposition(),
        makeRequest({ method: 'initialize', id: 99 })
      );
      expect(result.id).toBe(99);
    });
  });
});

// --- Hono app integration ---

describe('Hono app routes', () => {
  // We test the app by importing it and using Hono's request() method
  let app: any;

  beforeEach(async () => {
    // Dynamic import to get fresh app instance
    const mod = await import('../src/index.js');
    app = mod.default;
  });

  it('GET /health returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('mcp-composer');
  });

  it('POST /compose/:slug with non-JSON returns 415', async () => {
    const res = await app.request('/compose/test-comp', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    });
    expect(res.status).toBe(415);
  });

  it('POST /compose/:slug with invalid JSON returns parse error', async () => {
    const res = await app.request('/compose/test-comp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid json',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
  });
});
