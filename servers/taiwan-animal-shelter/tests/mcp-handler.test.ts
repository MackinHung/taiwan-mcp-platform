import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/search-adoptable.js', () => ({
  searchAdoptableAnimals: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'adoptable' }] }),
}));
vi.mock('../src/tools/animal-details.js', () => ({
  getAnimalDetails: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'details' }] }),
}));
vi.mock('../src/tools/search-shelters.js', () => ({
  searchShelters: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'shelters' }] }),
}));
vi.mock('../src/tools/shelter-stats.js', () => ({
  getShelterStats: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stats' }] }),
}));
vi.mock('../src/tools/recent-intakes.js', () => ({
  getRecentIntakes: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'recent' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-animal-shelter',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-animal-shelter');
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
      expect(names).toContain('search_adoptable_animals');
      expect(names).toContain('get_animal_details');
      expect(names).toContain('search_shelters');
      expect(names).toContain('get_shelter_stats');
      expect(names).toContain('get_recent_intakes');

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to correct handler for valid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_adoptable_animals', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('adoptable');
    });

    it('returns MethodNotFound for invalid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'search_adoptable_animals',
        'get_animal_details',
        'search_shelters',
        'get_shelter_stats',
        'get_recent_intakes',
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

    it('passes arguments to tool handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_animal_details', arguments: { animalId: 'A001' } },
      });
      expect((result.result as any).content[0].text).toBe('details');
    });

    it('defaults arguments to empty object when not provided', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_recent_intakes' },
      });
      expect((result.result as any).content[0].text).toBe('recent');
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest when jsonrpc is missing', async () => {
      const result = await handleRpcRequest(env, {
        id: 5,
        method: 'initialize',
      } as any);
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
      } as any);
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'unknown/method',
      });
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('unknown/method');
    });

    it('returns null id when id is not provided', async () => {
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

  it('get_animal_details requires animalId', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_animal_details');
    expect(tool!.inputSchema.required).toContain('animalId');
  });

  it('search_shelters requires keyword', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_shelters');
    expect(tool!.inputSchema.required).toContain('keyword');
  });
});
