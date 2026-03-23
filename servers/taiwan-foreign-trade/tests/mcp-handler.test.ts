import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/announcements.js', () => ({
  searchTradeAnnouncementsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'announcements' }] }),
}));
vi.mock('../src/tools/opportunities.js', () => ({
  searchGlobalBusinessOpportunitiesTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'opportunities' }] }),
}));
vi.mock('../src/tools/news.js', () => ({
  getTradeNewsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'news' }] }),
}));
vi.mock('../src/tools/regulations.js', () => ({
  lookupImportRegulationsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'regulations' }] }),
}));
vi.mock('../src/tools/agreements.js', () => ({
  listEcaFtaAgreementsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'agreements' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-foreign-trade',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-foreign-trade');
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
      expect(names).toContain('search_trade_announcements');
      expect(names).toContain('search_global_business_opportunities');
      expect(names).toContain('get_trade_news');
      expect(names).toContain('lookup_import_regulations');
      expect(names).toContain('list_eca_fta_agreements');

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to search_trade_announcements handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_trade_announcements', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('announcements');
    });

    it('routes to search_global_business_opportunities handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_global_business_opportunities', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('opportunities');
    });

    it('routes to get_trade_news handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_trade_news', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('news');
    });

    it('routes to lookup_import_regulations handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'lookup_import_regulations', arguments: { keyword: '半導體' } },
      });
      expect((result.result as any).content[0].text).toBe('regulations');
    });

    it('routes to list_eca_fta_agreements handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'list_eca_fta_agreements', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('agreements');
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
        'search_trade_announcements',
        'search_global_business_opportunities',
        'get_trade_news',
        'lookup_import_regulations',
        'list_eca_fta_agreements',
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
        params: { name: 'search_trade_announcements' },
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

  it('search_trade_announcements has keyword and limit properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_trade_announcements');
    expect(tool!.inputSchema.properties).toHaveProperty('keyword');
    expect(tool!.inputSchema.properties).toHaveProperty('limit');
  });

  it('search_global_business_opportunities has keyword, region, and limit', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_global_business_opportunities');
    expect(tool!.inputSchema.properties).toHaveProperty('keyword');
    expect(tool!.inputSchema.properties).toHaveProperty('region');
    expect(tool!.inputSchema.properties).toHaveProperty('limit');
  });

  it('lookup_import_regulations requires keyword', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'lookup_import_regulations');
    expect(tool!.inputSchema.required).toContain('keyword');
  });

  it('lookup_import_regulations has category enum', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'lookup_import_regulations');
    expect((tool!.inputSchema.properties as any).category.enum).toEqual([
      'industrial',
      'agricultural',
      'other',
    ]);
  });

  it('list_eca_fta_agreements has country and keyword properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'list_eca_fta_agreements');
    expect(tool!.inputSchema.properties).toHaveProperty('country');
    expect(tool!.inputSchema.properties).toHaveProperty('keyword');
  });
});
