import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/patent-search.js', () => ({
  searchPatents: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'patents' }] }),
}));
vi.mock('../src/tools/trademark-search.js', () => ({
  searchTrademarks: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'trademarks' }] }),
}));
vi.mock('../src/tools/ip-statistics.js', () => ({
  getIpStatistics: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stats' }] }),
}));
vi.mock('../src/tools/patent-classification.js', () => ({
  getPatentClassification: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'classification' }] }),
}));
vi.mock('../src/tools/filing-guide.js', () => ({
  getFilingGuide: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'guide' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-patent',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-patent');
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
      expect(names).toContain('search_patents');
      expect(names).toContain('search_trademarks');
      expect(names).toContain('get_ip_statistics');
      expect(names).toContain('get_patent_classification');
      expect(names).toContain('get_filing_guide');

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to correct handler for search_patents', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_patents', arguments: { keyword: '半導體' } },
      });
      expect((result.result as any).content[0].text).toBe('patents');
    });

    it('routes to correct handler for search_trademarks', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_trademarks', arguments: { keyword: 'Apple' } },
      });
      expect((result.result as any).content[0].text).toBe('trademarks');
    });

    it('returns MethodNotFound for invalid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'search_patents',
        'search_trademarks',
        'get_ip_statistics',
        'get_patent_classification',
        'get_filing_guide',
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
        id: 6,
        method: 'initialize',
      } as any);
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
      } as any);
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 8,
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

  it('search_patents and search_trademarks require keyword', () => {
    const patentTool = TOOL_DEFINITIONS.find((t) => t.name === 'search_patents');
    const trademarkTool = TOOL_DEFINITIONS.find((t) => t.name === 'search_trademarks');
    expect(patentTool?.inputSchema.required).toContain('keyword');
    expect(trademarkTool?.inputSchema.required).toContain('keyword');
  });

  it('get_patent_classification requires code', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'get_patent_classification');
    expect(tool?.inputSchema.required).toContain('code');
  });
});
