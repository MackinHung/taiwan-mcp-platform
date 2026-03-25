import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/zoning.js', () => ({
  queryZoningByLocation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'zoning-result' }] }),
  listUrbanZones: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'zones-list' }] }),
}));
vi.mock('../src/tools/facilities.js', () => ({
  queryPublicFacilities: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'facilities-result' }] }),
}));
vi.mock('../src/tools/renewal.js', () => ({
  queryUrbanRenewalAreas: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'renewal-result' }] }),
}));
vi.mock('../src/tools/land-use.js', () => ({
  queryLandUseClassification: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'land-use-result' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-zoning',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-zoning');
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
      expect(names).toContain('query_zoning_by_location');
      expect(names).toContain('list_urban_zones');
      expect(names).toContain('query_public_facilities');
      expect(names).toContain('query_urban_renewal_areas');
      expect(names).toContain('query_land_use_classification');

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
    it('routes to correct handler for query_zoning_by_location', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'query_zoning_by_location', arguments: { latitude: 25.033, longitude: 121.565 } },
      });
      expect((result.result as any).content[0].text).toBe('zoning-result');
    });

    it('routes to correct handler for list_urban_zones', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'list_urban_zones', arguments: { city: '臺北市' } },
      });
      expect((result.result as any).content[0].text).toBe('zones-list');
    });

    it('routes to correct handler for query_public_facilities', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'query_public_facilities', arguments: { latitude: 25.033, longitude: 121.535 } },
      });
      expect((result.result as any).content[0].text).toBe('facilities-result');
    });

    it('routes to correct handler for query_urban_renewal_areas', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'query_urban_renewal_areas', arguments: { city: '臺北市' } },
      });
      expect((result.result as any).content[0].text).toBe('renewal-result');
    });

    it('routes to correct handler for query_land_use_classification', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'query_land_use_classification', arguments: { latitude: 25.033, longitude: 121.565 } },
      });
      expect((result.result as any).content[0].text).toBe('land-use-result');
    });

    it('returns ToolNotFound for invalid tool name', async () => {
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

    it('handles missing arguments gracefully (defaults to empty)', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'query_zoning_by_location' },
      });
      // Should still call the handler with empty args
      expect(result.error).toBeUndefined();
      expect(result.result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest when jsonrpc is missing', async () => {
      const result = await handleRpcRequest(env, {
        id: 10,
        method: 'initialize',
      });
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 11,
      });
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 12,
        method: 'unknown/method',
      });
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('unknown/method');
    });

    it('preserves request id in responses', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 'string-id-42',
        method: 'initialize',
      });
      expect(result.id).toBe('string-id-42');
    });

    it('uses null id when id is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        method: 'initialize',
      });
      expect(result.id).toBeNull();
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

  it('each description is under 200 characters', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.description.length).toBeLessThanOrEqual(200);
    }
  });

  it('tools requiring coordinates have required fields', () => {
    const coordTools = TOOL_DEFINITIONS.filter((t) =>
      ['query_zoning_by_location', 'query_public_facilities', 'query_land_use_classification'].includes(t.name)
    );
    for (const tool of coordTools) {
      expect(tool.inputSchema.required).toContain('latitude');
      expect(tool.inputSchema.required).toContain('longitude');
    }
  });

  it('tools requiring city have required field', () => {
    const cityTools = TOOL_DEFINITIONS.filter((t) =>
      ['list_urban_zones', 'query_urban_renewal_areas'].includes(t.name)
    );
    for (const tool of cityTools) {
      expect(tool.inputSchema.required).toContain('city');
    }
  });
});
