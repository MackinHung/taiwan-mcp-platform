import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/violations.js', () => ({
  getFoodViolations: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'violations-data' }],
  }),
}));

vi.mock('../src/tools/business.js', () => ({
  searchFoodBusiness: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'business-data' }],
  }),
}));

vi.mock('../src/tools/drug-approval.js', () => ({
  searchDrugApproval: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'drug-approval-data' }],
  }),
}));

vi.mock('../src/tools/additives.js', () => ({
  searchFoodAdditives: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'additives-data' }],
  }),
}));

vi.mock('../src/tools/inspections.js', () => ({
  getHygieneInspections: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'inspections-data' }],
  }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = {
  SERVER_NAME: 'taiwan-food-safety',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleRpcRequest', () => {
  describe('initialize', () => {
    it('returns server info with protocol version', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {},
      });
      expect(result.error).toBeUndefined();
      const r = result.result as Record<string, unknown>;
      expect(r.protocolVersion).toBe('2024-11-05');
      const info = r.serverInfo as Record<string, string>;
      expect(info.name).toBe('taiwan-food-safety');
      expect(info.version).toBe('1.0.0');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      });
      const r = result.result as { tools: Array<{ name: string }> };
      expect(r.tools).toHaveLength(5);
      const names = r.tools.map((t) => t.name);
      expect(names).toContain('get_food_violations');
      expect(names).toContain('search_food_business');
      expect(names).toContain('search_drug_approval');
      expect(names).toContain('search_food_additives');
      expect(names).toContain('get_hygiene_inspections');
    });

    it('each tool has name, description, and inputSchema', () => {
      for (const tool of TOOL_DEFINITIONS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes get_food_violations to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_food_violations', arguments: { keyword: '黑心' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('violations-data');
    });

    it('routes search_food_business to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_food_business', arguments: { name: '大統' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('business-data');
    });

    it('routes search_drug_approval to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'search_drug_approval', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('drug-approval-data');
    });

    it('routes search_food_additives to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'search_food_additives', arguments: { name: '己二烯酸' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('additives-data');
    });

    it('routes get_hygiene_inspections to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_hygiene_inspections', arguments: { keyword: '台北' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('inspections-data');
    });

    it('returns error for unknown tool', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error?.code).toBe(-32601);
      expect(result.error?.message).toContain('nonexistent_tool');
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest when jsonrpc is not 2.0', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '1.0',
        id: 10,
        method: 'initialize',
      });
      expect(result.error?.code).toBe(-32600);
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 11,
      });
      expect(result.error?.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 12,
        method: 'unknown/method',
      });
      expect(result.error?.code).toBe(-32601);
      expect(result.error?.message).toContain('unknown/method');
    });

    it('preserves request id in response', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 999,
        method: 'initialize',
      });
      expect(result.id).toBe(999);
    });

    it('uses null when id is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        method: 'initialize',
      });
      expect(result.id).toBeNull();
    });
  });
});
