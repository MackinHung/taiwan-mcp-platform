import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/market.js', () => ({
  getMarketOverview: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'market-overview' }] }),
  getMarketIndices: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'market-indices' }] }),
  getTopVolume: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'top-volume' }] }),
}));

vi.mock('../src/tools/stock.js', () => ({
  getStockInfo: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stock-info' }] }),
  getStockSearch: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'stock-search' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = { SERVER_NAME: 'taiwan-stock', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleRpcRequest', () => {
  describe('initialize', () => {
    it('returns server info', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 1, method: 'initialize' });
      const r = result.result as Record<string, unknown>;
      expect(r.protocolVersion).toBe('2024-11-05');
      expect((r.serverInfo as Record<string, string>).name).toBe('taiwan-stock');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
      const r = result.result as { tools: Array<{ name: string }> };
      expect(r.tools).toHaveLength(5);
      const names = r.tools.map((t) => t.name);
      expect(names).toContain('get_market_overview');
      expect(names).toContain('get_market_indices');
      expect(names).toContain('get_top_volume');
      expect(names).toContain('get_stock_info');
      expect(names).toContain('get_stock_search');
    });

    it('each tool has name, description, inputSchema', () => {
      for (const tool of TOOL_DEFINITIONS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call routing', () => {
    it('routes get_market_overview', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'get_market_overview', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('market-overview');
    });

    it('routes get_market_indices', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'get_market_indices', arguments: { keyword: '電子' } },
      });
      expect((result.result as any).content[0].text).toBe('market-indices');
    });

    it('routes get_top_volume', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'get_top_volume', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('top-volume');
    });

    it('routes get_stock_info', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 6, method: 'tools/call',
        params: { name: 'get_stock_info', arguments: { code: '2330' } },
      });
      expect((result.result as any).content[0].text).toBe('stock-info');
    });

    it('routes get_stock_search', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 7, method: 'tools/call',
        params: { name: 'get_stock_search', arguments: { keyword: '台積' } },
      });
      expect((result.result as any).content[0].text).toBe('stock-search');
    });

    it('returns error for unknown tool', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 8, method: 'tools/call',
        params: { name: 'nonexistent', arguments: {} },
      });
      expect(result.error?.code).toBe(-32601);
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest for bad jsonrpc', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '1.0', id: 10, method: 'initialize' });
      expect(result.error?.code).toBe(-32600);
    });

    it('returns InvalidRequest for missing method', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 11 });
      expect(result.error?.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 12, method: 'unknown' });
      expect(result.error?.code).toBe(-32601);
    });

    it('preserves request id', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 999, method: 'initialize' });
      expect(result.id).toBe(999);
    });

    it('uses null for missing id', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', method: 'initialize' });
      expect(result.id).toBeNull();
    });
  });
});
