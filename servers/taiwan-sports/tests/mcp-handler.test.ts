import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/search-facilities.js', () => ({
  searchFacilitiesTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'facilities' }] }),
}));
vi.mock('../src/tools/nearby-facilities.js', () => ({
  searchNearbyTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'nearby' }] }),
}));
vi.mock('../src/tools/facility-details.js', () => ({
  getFacilityDetails: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'details' }] }),
}));
vi.mock('../src/tools/city-search.js', () => ({
  searchByCityTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'city' }] }),
}));
vi.mock('../src/tools/sport-types.js', () => ({
  getSportTypes: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'types' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-sports',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-sports');
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
      expect(names).toContain('search_facilities');
      expect(names).toContain('search_nearby');
      expect(names).toContain('get_facility_details');
      expect(names).toContain('search_by_city');
      expect(names).toContain('get_sport_types');

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
    it('routes to search_facilities handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_facilities', arguments: { sportType: '籃球' } },
      });
      expect((result.result as any).content[0].text).toBe('facilities');
    });

    it('routes to search_nearby handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_nearby', arguments: { lat: 25.0, lng: 121.5 } },
      });
      expect((result.result as any).content[0].text).toBe('nearby');
    });

    it('routes to get_facility_details handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_facility_details', arguments: { name: '小巨蛋' } },
      });
      expect((result.result as any).content[0].text).toBe('details');
    });

    it('routes to search_by_city handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'search_by_city', arguments: { city: '臺北市' } },
      });
      expect((result.result as any).content[0].text).toBe('city');
    });

    it('routes to get_sport_types handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_sport_types', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('types');
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
        'search_facilities',
        'search_nearby',
        'get_facility_details',
        'search_by_city',
        'get_sport_types',
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

  it('descriptions are in Traditional Chinese', () => {
    for (const tool of TOOL_DEFINITIONS) {
      // Check that description contains at least some CJK characters
      expect(/[\u4e00-\u9fff]/.test(tool.description)).toBe(true);
    }
  });
});
