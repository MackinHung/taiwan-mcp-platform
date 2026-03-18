import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/population.js', () => ({
  getPopulation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'population' }] }),
}));
vi.mock('../src/tools/age-distribution.js', () => ({
  getAgeDistribution: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'age-dist' }] }),
}));
vi.mock('../src/tools/vital-stats.js', () => ({
  getVitalStats: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'vital' }] }),
}));
vi.mock('../src/tools/household-stats.js', () => ({
  getHouseholdStats: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'household' }] }),
}));
vi.mock('../src/tools/compare-regions.js', () => ({
  compareRegions: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'compare' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-demographics',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-demographics');
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
      expect(names).toContain('get_population');
      expect(names).toContain('get_age_distribution');
      expect(names).toContain('get_vital_stats');
      expect(names).toContain('get_household_stats');
      expect(names).toContain('compare_regions');

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
    it('routes to get_population handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_population', arguments: { month: '202603' } },
      });
      expect((result.result as any).content[0].text).toBe('population');
    });

    it('routes to get_age_distribution handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_age_distribution', arguments: { month: '202603' } },
      });
      expect((result.result as any).content[0].text).toBe('age-dist');
    });

    it('routes to get_vital_stats handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_vital_stats', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('vital');
    });

    it('routes to get_household_stats handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_household_stats', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('household');
    });

    it('routes to compare_regions handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'compare_regions', arguments: { counties: ['臺北市', '新北市'] } },
      });
      expect((result.result as any).content[0].text).toBe('compare');
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
        'get_population',
        'get_age_distribution',
        'get_vital_stats',
        'get_household_stats',
        'compare_regions',
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

  it('compare_regions requires counties array', () => {
    const compareTool = TOOL_DEFINITIONS.find((t) => t.name === 'compare_regions')!;
    expect(compareTool.inputSchema.required).toContain('counties');
    expect(compareTool.inputSchema.properties!.counties).toBeDefined();
  });
});
