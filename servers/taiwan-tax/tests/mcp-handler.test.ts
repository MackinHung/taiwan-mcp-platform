import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/income-tax-calc.js', () => ({
  calculateIncomeTax: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'income-tax-calc' }] }),
  INCOME_TAX_BRACKETS: [],
}));

vi.mock('../src/tools/business-tax-lookup.js', () => ({
  lookupBusinessTax: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'business-tax-lookup' }] }),
}));

vi.mock('../src/tools/tax-brackets.js', () => ({
  getTaxBrackets: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'tax-brackets' }] }),
  INCOME_BRACKETS: [],
  BUSINESS_TAX_THRESHOLD: 120000,
  BUSINESS_TAX_RATE: 0.20,
}));

vi.mock('../src/tools/tax-calendar.js', () => ({
  getTaxCalendar: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'tax-calendar' }] }),
  TAX_CALENDAR: [],
}));

vi.mock('../src/tools/business-tax-stats.js', () => ({
  getTaxStatistics: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'tax-statistics' }] }),
  TAX_STATS_RESOURCE_ID: 'test-id',
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = { SERVER_NAME: 'taiwan-tax', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleRpcRequest', () => {
  describe('initialize', () => {
    it('returns server info', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 1, method: 'initialize' });
      const r = result.result as Record<string, unknown>;
      expect(r.protocolVersion).toBe('2024-11-05');
      expect((r.serverInfo as Record<string, string>).name).toBe('taiwan-tax');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools', async () => {
      const result = await handleRpcRequest(env, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
      const r = result.result as { tools: Array<{ name: string }> };
      expect(r.tools).toHaveLength(5);
      const names = r.tools.map((t) => t.name);
      expect(names).toContain('calculate_income_tax');
      expect(names).toContain('lookup_business_tax');
      expect(names).toContain('get_tax_brackets');
      expect(names).toContain('get_tax_calendar');
      expect(names).toContain('get_tax_statistics');
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
    it('routes calculate_income_tax', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'calculate_income_tax', arguments: { annualIncome: 1000000 } },
      });
      expect((result.result as any).content[0].text).toBe('income-tax-calc');
    });

    it('routes lookup_business_tax', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'lookup_business_tax', arguments: { keyword: '台積' } },
      });
      expect((result.result as any).content[0].text).toBe('business-tax-lookup');
    });

    it('routes get_tax_brackets', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'get_tax_brackets', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('tax-brackets');
    });

    it('routes get_tax_calendar', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 6, method: 'tools/call',
        params: { name: 'get_tax_calendar', arguments: { month: 5 } },
      });
      expect((result.result as any).content[0].text).toBe('tax-calendar');
    });

    it('routes get_tax_statistics', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0', id: 7, method: 'tools/call',
        params: { name: 'get_tax_statistics', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('tax-statistics');
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
