import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/search-attractions.js', () => ({
  searchAttractions: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'attractions' }] }),
}));
vi.mock('../src/tools/attraction-details.js', () => ({
  getAttractionDetails: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'details' }] }),
}));
vi.mock('../src/tools/search-events.js', () => ({
  searchEvents: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'events' }] }),
}));
vi.mock('../src/tools/search-accommodation.js', () => ({
  searchAccommodation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'accommodation' }] }),
}));
vi.mock('../src/tools/get-trails.js', () => ({
  getTrails: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'trails' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-tourism',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-tourism');
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
      expect(names).toContain('search_attractions');
      expect(names).toContain('get_attraction_details');
      expect(names).toContain('search_events');
      expect(names).toContain('search_accommodation');
      expect(names).toContain('get_trails');

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
    it('routes to search_attractions', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_attractions', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('attractions');
    });

    it('routes to get_attraction_details', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_attraction_details', arguments: { name: '太魯閣' } },
      });
      expect((result.result as any).content[0].text).toBe('details');
    });

    it('routes to search_events', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'search_events', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('events');
    });

    it('routes to search_accommodation', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'search_accommodation', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('accommodation');
    });

    it('routes to get_trails', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_trails', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('trails');
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
        'search_attractions',
        'get_attraction_details',
        'search_events',
        'search_accommodation',
        'get_trails',
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

  it('descriptions are in 繁體中文', () => {
    for (const tool of TOOL_DEFINITIONS) {
      // Each description should contain at least one CJK character
      expect(tool.description).toMatch(/[\u4e00-\u9fff]/);
    }
  });
});
