import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/truck-schedule.js', () => ({
  getTruckSchedule: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'schedule' }] }),
}));
vi.mock('../src/tools/realtime-location.js', () => ({
  getRealtimeLocation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'location' }] }),
}));
vi.mock('../src/tools/recycling-schedule.js', () => ({
  getRecyclingSchedule: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'recycling' }] }),
}));
vi.mock('../src/tools/district-search.js', () => ({
  searchByDistrict: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'district' }] }),
}));
vi.mock('../src/tools/supported-cities.js', () => ({
  getSupportedCities: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'cities' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-garbage',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-garbage');
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
      expect(names).toContain('get_truck_schedule');
      expect(names).toContain('get_realtime_location');
      expect(names).toContain('get_recycling_schedule');
      expect(names).toContain('search_by_district');
      expect(names).toContain('get_supported_cities');

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
    it('routes to get_truck_schedule handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_truck_schedule', arguments: { city: 'tainan' } },
      });
      expect((result.result as any).content[0].text).toBe('schedule');
    });

    it('routes to get_realtime_location handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_realtime_location', arguments: { city: 'tainan' } },
      });
      expect((result.result as any).content[0].text).toBe('location');
    });

    it('routes to get_recycling_schedule handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_recycling_schedule', arguments: { city: 'tainan' } },
      });
      expect((result.result as any).content[0].text).toBe('recycling');
    });

    it('routes to search_by_district handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'search_by_district', arguments: { city: 'tainan', district: '中西' } },
      });
      expect((result.result as any).content[0].text).toBe('district');
    });

    it('routes to get_supported_cities handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_supported_cities', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('cities');
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
        'get_truck_schedule',
        'get_realtime_location',
        'get_recycling_schedule',
        'search_by_district',
        'get_supported_cities',
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
