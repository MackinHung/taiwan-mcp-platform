import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/search-by-area.js', () => ({
  searchTransactionsByArea: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '中和區成交資料' }],
  }),
}));
vi.mock('../src/tools/search-by-date.js', () => ({
  searchTransactionsByDate: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '日期範圍成交資料' }],
  }),
}));
vi.mock('../src/tools/price-statistics.js', () => ({
  getAreaPriceStatistics: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '房價統計' }],
  }),
}));
vi.mock('../src/tools/recent-transactions.js', () => ({
  getRecentTransactions: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '最新成交' }],
  }),
}));
vi.mock('../src/tools/price-trend.js', () => ({
  getPriceTrend: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '房價趨勢' }],
  }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-realestate',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-realestate');
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
      expect(names).toContain('search_transactions_by_area');
      expect(names).toContain('search_transactions_by_date');
      expect(names).toContain('get_area_price_statistics');
      expect(names).toContain('get_recent_transactions');
      expect(names).toContain('get_price_trend');

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
    it('routes to search_transactions_by_area handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_transactions_by_area', arguments: { district: '中和區' } },
      });
      expect((result.result as any).content[0].text).toBe('中和區成交資料');
    });

    it('routes to search_transactions_by_date handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_transactions_by_date', arguments: { start_date: '202501' } },
      });
      expect((result.result as any).content[0].text).toBe('日期範圍成交資料');
    });

    it('routes to get_area_price_statistics handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_area_price_statistics', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('房價統計');
    });

    it('routes to get_recent_transactions handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_recent_transactions', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('最新成交');
    });

    it('routes to get_price_trend handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_price_trend', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('房價趨勢');
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

    it('routes each tool correctly without errors', async () => {
      const toolNames = [
        'search_transactions_by_area',
        'search_transactions_by_date',
        'get_area_price_statistics',
        'get_recent_transactions',
        'get_price_trend',
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

  it('all descriptions are under 200 characters', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.description.length).toBeLessThanOrEqual(200);
    }
  });
});
