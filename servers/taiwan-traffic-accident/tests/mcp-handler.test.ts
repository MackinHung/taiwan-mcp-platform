import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/recent-accidents.js', () => ({
  getRecentAccidents: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'recent' }] }),
}));
vi.mock('../src/tools/search-location.js', () => ({
  searchByLocation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'location' }] }),
}));
vi.mock('../src/tools/accident-stats.js', () => ({
  getAccidentStats: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stats' }] }),
}));
vi.mock('../src/tools/dangerous-intersections.js', () => ({
  getDangerousIntersections: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'intersections' }] }),
}));
vi.mock('../src/tools/historical-trends.js', () => ({
  getHistoricalTrends: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'trends' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-traffic-accident',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-traffic-accident');
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
      expect(names).toContain('get_recent_accidents');
      expect(names).toContain('search_by_location');
      expect(names).toContain('get_accident_stats');
      expect(names).toContain('get_dangerous_intersections');
      expect(names).toContain('get_historical_trends');

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
    it('routes to correct handler for get_recent_accidents', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_recent_accidents', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('recent');
    });

    it('routes to correct handler for search_by_location', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_by_location', arguments: { county: '臺北市' } },
      });
      expect((result.result as any).content[0].text).toBe('location');
    });

    it('returns MethodNotFound for invalid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'get_recent_accidents',
        'search_by_location',
        'get_accident_stats',
        'get_dangerous_intersections',
        'get_historical_trends',
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
        id: 6,
        method: 'initialize',
      } as any);
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
      } as any);
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 8,
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

  it('search_by_location requires county', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_by_location')!;
    expect(tool.inputSchema.required).toContain('county');
  });
});
