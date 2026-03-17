import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock proxy to avoid real HTTP calls
vi.mock('../src/proxy.js', () => ({
  proxyToolCall: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'proxied result' }],
  }),
}));

import { handleComposerRpc } from '../src/mcp-handler.js';
import type { ServerMapping } from '../src/router.js';

const mappings: ServerMapping[] = [
  {
    namespacePrefix: 'weather',
    serverId: 'srv001',
    endpointUrl: 'https://weather.example.com',
    tools: [
      { name: 'get_forecast', description: 'Forecast', inputSchema: { type: 'object', properties: { city: { type: 'string' } } } },
    ],
  },
  {
    namespacePrefix: 'transit',
    serverId: 'srv002',
    endpointUrl: 'https://transit.example.com',
    tools: [
      { name: 'get_arrivals', description: 'Arrivals', inputSchema: { type: 'object', properties: {} } },
    ],
  },
];

describe('handleComposerRpc', () => {
  describe('initialize', () => {
    it('returns server info and capabilities', async () => {
      const result = await handleComposerRpc(mappings, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
      });
      expect(result.jsonrpc).toBe('2.0');
      expect(result.result.protocolVersion).toBe('2024-11-05');
      expect(result.result.serverInfo.name).toBe('mcp-composer');
      expect(result.result.capabilities).toHaveProperty('tools');
    });
  });

  describe('tools/list', () => {
    it('returns all namespaced tools (mode A, <=5 servers)', async () => {
      const result = await handleComposerRpc(mappings, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });
      expect(result.result.tools).toHaveLength(2);
      const names = result.result.tools.map((t: any) => t.name);
      expect(names).toContain('weather.get_forecast');
      expect(names).toContain('transit.get_arrivals');
    });

    it('returns meta-tools for mode B (>5 servers)', async () => {
      const manyMappings = Array.from({ length: 6 }, (_, i) => ({
        namespacePrefix: `s${i}`,
        serverId: `srv${i}`,
        endpointUrl: `https://s${i}.example.com`,
        tools: [{ name: 'tool1', description: 'T', inputSchema: { type: 'object' as const, properties: {} } }],
      }));
      const result = await handleComposerRpc(manyMappings, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/list',
      });
      const names = result.result.tools.map((t: any) => t.name);
      expect(names).toContain('discover_tools');
      expect(names).toContain('execute_tool');
    });
  });

  describe('tools/call', () => {
    it('routes namespaced tool to correct upstream', async () => {
      const result = await handleComposerRpc(mappings, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'weather.get_forecast', arguments: { city: 'Taipei' } },
      });
      expect(result.result.content[0].text).toBe('proxied result');
    });

    it('returns error for unknown namespace', async () => {
      const result = await handleComposerRpc(mappings, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'unknown.tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32601);
    });

    it('returns error for non-namespaced tool', async () => {
      const result = await handleComposerRpc(mappings, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_forecast', arguments: {} },
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest for missing jsonrpc', async () => {
      const result = await handleComposerRpc(mappings, {
        id: 7,
        method: 'initialize',
      });
      expect(result.error.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleComposerRpc(mappings, {
        jsonrpc: '2.0',
        id: 8,
        method: 'unknown/method',
      });
      expect(result.error.code).toBe(-32601);
    });
  });
});
