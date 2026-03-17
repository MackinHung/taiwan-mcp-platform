import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/trade-stats.js', () => ({
  getTradeStatistics: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'trade-stats' }] }),
}));

vi.mock('../src/tools/trader-lookup.js', () => ({
  lookupTrader: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'trader-lookup' }] }),
}));

vi.mock('../src/tools/tariff-lookup.js', () => ({
  lookupTariff: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'tariff-lookup' }] }),
}));

vi.mock('../src/tools/top-trade-partners.js', () => ({
  getTopTradePartners: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'top-partners' }] }),
}));

vi.mock('../src/tools/hs-code-lookup.js', () => ({
  lookupHsCode: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'hs-code' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = { SERVER_NAME: 'taiwan-customs', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleRpcRequest', () => {
  describe('initialize', () => {
    it('returns server info', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 1, method: 'initialize' });
      const r = result.result as Record<string, unknown>;
      expect(r.protocolVersion).toBe('2024-11-05');
      expect((r.serverInfo as Record<string, string>).name).toBe('taiwan-customs');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
      const r = result.result as { tools: Array<{ name: string }> };
      expect(r.tools).toHaveLength(5);
      const names = r.tools.map((t) => t.name);
      expect(names).toContain('get_trade_statistics');
      expect(names).toContain('lookup_trader');
      expect(names).toContain('lookup_tariff');
      expect(names).toContain('get_top_trade_partners');
      expect(names).toContain('lookup_hs_code');
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
    it('routes get_trade_statistics', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'get_trade_statistics', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('trade-stats');
    });

    it('routes lookup_trader', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'lookup_trader', arguments: { keyword: '台積電' } },
      });
      expect((result.result as any).content[0].text).toBe('trader-lookup');
    });

    it('routes lookup_tariff', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'lookup_tariff', arguments: { keyword: '8471' } },
      });
      expect((result.result as any).content[0].text).toBe('tariff-lookup');
    });

    it('routes get_top_trade_partners', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 6, method: 'tools/call',
        params: { name: 'get_top_trade_partners', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('top-partners');
    });

    it('routes lookup_hs_code', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 7, method: 'tools/call',
        params: { name: 'lookup_hs_code', arguments: { code: '8471' } },
      });
      expect((result.result as any).content[0].text).toBe('hs-code');
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
