import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/list.js', () => ({
  listAnnouncementsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'list' }] }),
}));
vi.mock('../src/tools/search.js', () => ({
  searchAnnouncementsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'search' }] }),
}));
vi.mock('../src/tools/by-agency.js', () => ({
  getAnnouncementsByAgencyTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'agency' }] }),
}));
vi.mock('../src/tools/by-date.js', () => ({
  getAnnouncementsByDateTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'date' }] }),
}));
vi.mock('../src/tools/stats.js', () => ({
  getAnnouncementStatsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stats' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-announce',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-announce');
      expect((result.result as any).serverInfo.version).toBe('1.0.0');
      expect((result.result as any).capabilities).toHaveProperty('tools');
    });

    it('returns correct id from request', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 42,
        method: 'initialize',
      });
      expect(result.id).toBe(42);
    });

    it('uses null id when id is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        method: 'initialize',
      });
      expect(result.id).toBeNull();
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
      expect(names).toContain('list_announcements');
      expect(names).toContain('search_announcements');
      expect(names).toContain('get_announcements_by_agency');
      expect(names).toContain('get_announcements_by_date');
      expect(names).toContain('get_announcement_stats');

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
    it('routes to list_announcements handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'list_announcements', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('list');
    });

    it('routes to search_announcements handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_announcements', arguments: { keyword: '測試' } },
      });
      expect((result.result as any).content[0].text).toBe('search');
    });

    it('routes to get_announcements_by_agency handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_announcements_by_agency', arguments: { agency: '財政部' } },
      });
      expect((result.result as any).content[0].text).toBe('agency');
    });

    it('routes to get_announcements_by_date handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_announcements_by_date', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('date');
    });

    it('routes to get_announcement_stats handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_announcement_stats', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('stats');
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

    it('routes each tool correctly', async () => {
      const toolNames = [
        'list_announcements',
        'search_announcements',
        'get_announcements_by_agency',
        'get_announcements_by_date',
        'get_announcement_stats',
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

    it('passes arguments to handler when no arguments provided', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'list_announcements' },
      });
      expect(result.error).toBeUndefined();
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

    it('returns InvalidRequest when jsonrpc version is wrong', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '1.0',
        id: 10,
        method: 'initialize',
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

  it('list_announcements has limit and offset properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'list_announcements');
    expect(tool!.inputSchema.properties).toHaveProperty('limit');
    expect(tool!.inputSchema.properties).toHaveProperty('offset');
  });

  it('search_announcements requires keyword', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_announcements');
    expect(tool!.inputSchema.required).toContain('keyword');
  });

  it('get_announcements_by_agency requires agency', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_announcements_by_agency');
    expect(tool!.inputSchema.required).toContain('agency');
  });

  it('get_announcements_by_date has date_field with enum', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_announcements_by_date');
    expect(tool!.inputSchema.properties).toHaveProperty('date_field');
    expect((tool!.inputSchema.properties as any).date_field.enum).toEqual(['send', 'doc', 'due']);
  });

  it('get_announcement_stats has empty properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_announcement_stats');
    expect(Object.keys(tool!.inputSchema.properties as object)).toHaveLength(0);
  });
});
