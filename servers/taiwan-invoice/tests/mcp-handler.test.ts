import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/winning-list.js', () => ({
  getWinningNumbers: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'winning' }] }),
}));
vi.mock('../src/tools/check-number.js', () => ({
  checkInvoiceNumber: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'check' }] }),
}));
vi.mock('../src/tools/invoice-header.js', () => ({
  queryInvoiceHeader: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'header' }] }),
}));
vi.mock('../src/tools/invoice-detail.js', () => ({
  queryInvoiceDetail: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'detail' }] }),
}));
vi.mock('../src/tools/recent-periods.js', () => ({
  getRecentPeriods: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'periods' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  EINVOICE_APP_ID: 'test-app-id',
  EINVOICE_UUID: 'test-uuid',
  SERVER_NAME: 'taiwan-invoice',
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
      expect((result.result as any).serverInfo.name).toBe('taiwan-invoice');
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
      expect(names).toContain('get_winning_numbers');
      expect(names).toContain('check_invoice_number');
      expect(names).toContain('query_invoice_header');
      expect(names).toContain('query_invoice_detail');
      expect(names).toContain('get_recent_periods');

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
    it('routes to correct handler for get_winning_numbers', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_winning_numbers', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('winning');
    });

    it('routes to correct handler for check_invoice_number', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'check_invoice_number', arguments: { invoiceNumber: '12345678' } },
      });
      expect((result.result as any).content[0].text).toBe('check');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'get_winning_numbers',
        'check_invoice_number',
        'query_invoice_header',
        'query_invoice_detail',
        'get_recent_periods',
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

    it('returns error for unknown tool name', async () => {
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
});
