import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/get-latest.js', () => ({
  getLatestGazetteTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'latest' }] }),
}));
vi.mock('../src/tools/search.js', () => ({
  searchGazetteTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'search' }] }),
}));
vi.mock('../src/tools/detail.js', () => ({
  getGazetteDetailTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'detail' }] }),
}));
vi.mock('../src/tools/draft.js', () => ({
  listDraftRegulationsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'draft' }] }),
}));
vi.mock('../src/tools/statistics.js', () => ({
  getGazetteStatisticsTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'statistics' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-gazette',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-gazette');
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
      expect(names).toContain('get_latest_gazette');
      expect(names).toContain('search_gazette');
      expect(names).toContain('get_gazette_detail');
      expect(names).toContain('list_draft_regulations');
      expect(names).toContain('get_gazette_statistics');

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to get_latest_gazette handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_latest_gazette', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('latest');
    });

    it('routes to search_gazette handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_gazette', arguments: { keyword: '測試' } },
      });
      expect((result.result as any).content[0].text).toBe('search');
    });

    it('routes to get_gazette_detail handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_gazette_detail', arguments: { meta_id: '164288' } },
      });
      expect((result.result as any).content[0].text).toBe('detail');
    });

    it('routes to list_draft_regulations handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'list_draft_regulations', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('draft');
    });

    it('routes to get_gazette_statistics handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_gazette_statistics', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('statistics');
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
        'get_latest_gazette',
        'search_gazette',
        'get_gazette_detail',
        'list_draft_regulations',
        'get_gazette_statistics',
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
        params: { name: 'get_latest_gazette' },
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

  it('get_latest_gazette has limit and offset properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_latest_gazette');
    expect(tool!.inputSchema.properties).toHaveProperty('limit');
    expect(tool!.inputSchema.properties).toHaveProperty('offset');
  });

  it('search_gazette requires keyword', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_gazette');
    expect(tool!.inputSchema.required).toContain('keyword');
  });

  it('search_gazette has filter properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'search_gazette');
    const props = tool!.inputSchema.properties as Record<string, unknown>;
    expect(props).toHaveProperty('keyword');
    expect(props).toHaveProperty('chapter');
    expect(props).toHaveProperty('doc_type');
    expect(props).toHaveProperty('start_date');
    expect(props).toHaveProperty('end_date');
    expect(props).toHaveProperty('page');
    expect(props).toHaveProperty('page_size');
  });

  it('get_gazette_detail requires meta_id', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_gazette_detail');
    expect(tool!.inputSchema.required).toContain('meta_id');
  });

  it('list_draft_regulations has page properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'list_draft_regulations');
    const props = tool!.inputSchema.properties as Record<string, unknown>;
    expect(props).toHaveProperty('page');
    expect(props).toHaveProperty('page_size');
  });

  it('get_gazette_statistics has empty properties', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_gazette_statistics');
    expect(Object.keys(tool!.inputSchema.properties as object)).toHaveLength(0);
  });
});
