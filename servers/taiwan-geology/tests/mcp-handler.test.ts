import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/liquefaction.js', () => ({
  queryLiquefactionPotential: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'liquefaction-result' }] }),
}));
vi.mock('../src/tools/faults.js', () => ({
  getActiveFaultsNearby: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'faults-result' }] }),
}));
vi.mock('../src/tools/sensitive-areas.js', () => ({
  querySensitiveAreas: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'sensitive-areas-result' }] }),
}));
vi.mock('../src/tools/landslide.js', () => ({
  getLandslideAlerts: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'landslide-result' }] }),
}));
vi.mock('../src/tools/geological-info.js', () => ({
  getGeologicalInfo: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'geological-info-result' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-geology',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-geology');
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
      expect(names).toContain('query_liquefaction_potential');
      expect(names).toContain('get_active_faults_nearby');
      expect(names).toContain('query_sensitive_areas');
      expect(names).toContain('get_landslide_alerts');
      expect(names).toContain('get_geological_info');

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to query_liquefaction_potential handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'query_liquefaction_potential', arguments: { latitude: 25.0, longitude: 121.5 } },
      });
      expect((result.result as any).content[0].text).toBe('liquefaction-result');
    });

    it('routes to get_active_faults_nearby handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_active_faults_nearby', arguments: { latitude: 24.0, longitude: 120.5 } },
      });
      expect((result.result as any).content[0].text).toBe('faults-result');
    });

    it('routes to get_landslide_alerts handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_landslide_alerts', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('landslide-result');
    });

    it('returns error for nonexistent tool', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'query_liquefaction_potential',
        'get_active_faults_nearby',
        'query_sensitive_areas',
        'get_landslide_alerts',
        'get_geological_info',
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
        id: 7,
        method: 'initialize',
      } as any);
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 8,
      } as any);
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 9,
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

  it('each description is <= 200 chars', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.description.length).toBeLessThanOrEqual(200);
    }
  });
});
