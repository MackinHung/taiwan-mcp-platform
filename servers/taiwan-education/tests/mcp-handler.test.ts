import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/search-universities.js', () => ({
  searchUniversities: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'universities' }] }),
}));
vi.mock('../src/tools/search-schools.js', () => ({
  searchSchools: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'schools' }] }),
}));
vi.mock('../src/tools/school-details.js', () => ({
  getSchoolDetails: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'details' }] }),
}));
vi.mock('../src/tools/education-stats.js', () => ({
  getEducationStats: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stats' }] }),
}));
vi.mock('../src/tools/search-by-location.js', () => ({
  searchByLocation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'location' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-education',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-education');
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
      expect(names).toContain('search_universities');
      expect(names).toContain('search_schools');
      expect(names).toContain('get_school_details');
      expect(names).toContain('get_education_stats');
      expect(names).toContain('search_by_location');

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
    it('routes to search_universities handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_universities', arguments: { keyword: '臺灣' } },
      });
      expect((result.result as any).content[0].text).toBe('universities');
    });

    it('routes to search_schools handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_schools', arguments: { keyword: '國中' } },
      });
      expect((result.result as any).content[0].text).toBe('schools');
    });

    it('routes to get_school_details handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_school_details', arguments: { name: '臺灣大學' } },
      });
      expect((result.result as any).content[0].text).toBe('details');
    });

    it('routes to get_education_stats handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_education_stats', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('stats');
    });

    it('routes to search_by_location handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'search_by_location', arguments: { city: '臺北市' } },
      });
      expect((result.result as any).content[0].text).toBe('location');
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
        'search_universities',
        'search_schools',
        'get_school_details',
        'get_education_stats',
        'search_by_location',
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

  it('tool descriptions are in Traditional Chinese', () => {
    for (const tool of TOOL_DEFINITIONS) {
      // Check for CJK characters
      expect(/[\u4e00-\u9fff]/.test(tool.description)).toBe(true);
    }
  });
});
