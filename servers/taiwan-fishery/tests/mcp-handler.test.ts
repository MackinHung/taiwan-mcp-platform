import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/fishery-production.js', () => ({
  getFisheryProduction: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'fishery-production-data' }],
  }),
}));

vi.mock('../src/tools/search-ports.js', () => ({
  searchFishingPorts: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'search-ports-data' }],
  }),
}));

vi.mock('../src/tools/species-info.js', () => ({
  getSpeciesInfo: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'species-info-data' }],
  }),
}));

vi.mock('../src/tools/aquaculture-stats.js', () => ({
  getAquacultureStats: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'aquaculture-stats-data' }],
  }),
}));

vi.mock('../src/tools/fishery-trends.js', () => ({
  getFisheryTrends: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'fishery-trends-data' }],
  }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = {
  SERVER_NAME: 'taiwan-fishery',
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
      expect(info.name).toBe('taiwan-fishery');
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
      expect(names).toContain('get_fishery_production');
      expect(names).toContain('search_fishing_ports');
      expect(names).toContain('get_species_info');
      expect(names).toContain('get_aquaculture_stats');
      expect(names).toContain('get_fishery_trends');
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
    it('routes get_fishery_production to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_fishery_production', arguments: { category: '遠洋漁業' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('fishery-production-data');
    });

    it('routes search_fishing_ports to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_fishing_ports', arguments: { keyword: '前鎮' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('search-ports-data');
    });

    it('routes get_species_info to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_species_info', arguments: { species: '鮪魚' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('species-info-data');
    });

    it('routes get_aquaculture_stats to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_aquaculture_stats', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('aquaculture-stats-data');
    });

    it('routes get_fishery_trends to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_fishery_trends', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('fishery-trends-data');
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
