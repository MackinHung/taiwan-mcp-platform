import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/current-radiation.js', () => ({
  getCurrentRadiation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'current-radiation' }] }),
}));
vi.mock('../src/tools/search-by-region.js', () => ({
  searchByRegion: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'search-region' }] }),
}));
vi.mock('../src/tools/radiation-alerts.js', () => ({
  getRadiationAlerts: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'alerts' }] }),
}));
vi.mock('../src/tools/station-history.js', () => ({
  getStationHistory: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'history' }] }),
}));
vi.mock('../src/tools/radiation-summary.js', () => ({
  getRadiationSummary: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'summary' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-radiation',
  SERVER_VERSION: '1.0.0',
};

describe('handleRpcRequest', () => {
  describe('initialize', () => {
    it('returns server info with name, version, capabilities', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {},
      });
      expect(result.jsonrpc).toBe('2.0');
      expect(result.id).toBe(1);
      expect((result.result as any).protocolVersion).toBe('2024-11-05');
      expect((result.result as any).serverInfo.name).toBe('taiwan-radiation');
      expect((result.result as any).serverInfo.version).toBe('1.0.0');
      expect((result.result as any).capabilities).toHaveProperty('tools');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools with correct schemas', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      });
      const tools = (result.result as any).tools;
      expect(tools).toHaveLength(5);
      const names = tools.map((t: any) => t.name);
      expect(names).toContain('get_current_radiation');
      expect(names).toContain('search_by_region');
      expect(names).toContain('get_radiation_alerts');
      expect(names).toContain('get_station_history');
      expect(names).toContain('get_radiation_summary');

      // Verify each tool has inputSchema
      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to correct handler for get_current_radiation', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_current_radiation', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('current-radiation');
    });

    it('routes to correct handler for search_by_region', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_by_region', arguments: { region: '台北' } },
      });
      expect((result.result as any).content[0].text).toBe('search-region');
    });

    it('routes to correct handler for get_radiation_alerts', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_radiation_alerts', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('alerts');
    });

    it('routes to correct handler for get_station_history', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_station_history', arguments: { stationName: '台北站' } },
      });
      expect((result.result as any).content[0].text).toBe('history');
    });

    it('routes to correct handler for get_radiation_summary', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_radiation_summary', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('summary');
    });

    it('returns MethodNotFound for invalid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'get_current_radiation',
        'search_by_region',
        'get_radiation_alerts',
        'get_station_history',
        'get_radiation_summary',
      ];
      for (const name of toolNames) {
        const result = await handleRpcRequest(env, {
          jsonrpc: '2.0',
          id: 100,
          method: 'tools/call',
          params: { name, arguments: {} },
        });
        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest when jsonrpc is missing', async () => {
      const result = await handleRpcRequest(env, {
        id: 9,
        method: 'initialize',
      } as any);
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 10,
      } as any);
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 11,
        method: 'unknown/method',
      });
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('unknown/method');
    });
  });
});

describe('TOOL_DEFINITIONS', () => {
  it('has 5 tool definitions', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(5);
  });

  it('each tool has name, description, and inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });
});
