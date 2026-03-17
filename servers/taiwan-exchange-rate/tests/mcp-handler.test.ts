import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/current-rates.js', () => ({
  getCurrentRates: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'current-rates' }] }),
}));
vi.mock('../src/tools/rate-by-currency.js', () => ({
  getRateByCurrency: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'rate-by-currency' }] }),
}));
vi.mock('../src/tools/historical-rate.js', () => ({
  getHistoricalRate: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'historical-rate' }] }),
}));
vi.mock('../src/tools/convert-currency.js', () => ({
  convertCurrency: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'convert-currency' }] }),
}));
vi.mock('../src/tools/rate-comparison.js', () => ({
  compareRates: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'compare-rates' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-exchange-rate',
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
      const res = result.result as any;
      expect(res.protocolVersion).toBe('2024-11-05');
      expect(res.serverInfo.name).toBe('taiwan-exchange-rate');
      expect(res.serverInfo.version).toBe('1.0.0');
      expect(res.capabilities).toHaveProperty('tools');
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
      const res = result.result as any;
      expect(res.tools).toHaveLength(5);
      const names = res.tools.map((t: any) => t.name);
      expect(names).toContain('get_current_rates');
      expect(names).toContain('get_rate_by_currency');
      expect(names).toContain('get_historical_rate');
      expect(names).toContain('convert_currency');
      expect(names).toContain('compare_rates');

      // Verify each tool has inputSchema
      for (const tool of res.tools) {
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
        params: { name: 'get_current_rates', arguments: {} },
      });
      const res = result.result as any;
      expect(res.content[0].text).toBe('current-rates');
    });

    it('returns error for invalid tool name', async () => {
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
      const toolExpected: Record<string, string> = {
        get_current_rates: 'current-rates',
        get_rate_by_currency: 'rate-by-currency',
        get_historical_rate: 'historical-rate',
        convert_currency: 'convert-currency',
        compare_rates: 'compare-rates',
      };
      for (const [name, expected] of Object.entries(toolExpected)) {
        const result = await handleRpcRequest(env, {
          jsonrpc: '2.0',
          id: 100,
          method: 'tools/call',
          params: { name, arguments: {} },
        });
        expect(result.error).toBeUndefined();
        const res = result.result as any;
        expect(res.content[0].text).toBe(expected);
      }
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
});
