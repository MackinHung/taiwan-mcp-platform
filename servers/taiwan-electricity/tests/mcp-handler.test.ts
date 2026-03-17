import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/overview.js', () => ({
  getPowerOverview: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'power-overview' }],
  }),
}));

vi.mock('../src/tools/generation.js', () => ({
  getGenerationUnits: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'generation-units' }],
  }),
  getGenerationBySource: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'generation-by-source' }],
  }),
  getRenewableEnergy: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'renewable-energy' }],
  }),
  getPowerPlantStatus: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'plant-status' }],
  }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = {
  SERVER_NAME: 'taiwan-electricity',
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
      });
      expect(result.error).toBeUndefined();
      const r = result.result as Record<string, unknown>;
      expect(r.protocolVersion).toBe('2024-11-05');
      const info = r.serverInfo as Record<string, string>;
      expect(info.name).toBe('taiwan-electricity');
      expect(info.version).toBe('1.0.0');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });
      const r = result.result as { tools: Array<{ name: string }> };
      expect(r.tools).toHaveLength(5);
      const names = r.tools.map((t) => t.name);
      expect(names).toContain('get_power_overview');
      expect(names).toContain('get_generation_units');
      expect(names).toContain('get_generation_by_source');
      expect(names).toContain('get_renewable_energy');
      expect(names).toContain('get_power_plant_status');
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
    it('routes get_power_overview', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_power_overview', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('power-overview');
    });

    it('routes get_generation_units', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_generation_units', arguments: { source_type: '燃氣' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('generation-units');
    });

    it('routes get_generation_by_source', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_generation_by_source', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('generation-by-source');
    });

    it('routes get_renewable_energy', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_renewable_energy', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('renewable-energy');
    });

    it('routes get_power_plant_status', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_power_plant_status', arguments: { plant: '大潭' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('plant-status');
    });

    it('returns error for unknown tool', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'nonexistent', arguments: {} },
      });
      expect(result.error?.code).toBe(-32601);
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
    });

    it('preserves request id', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 999,
        method: 'initialize',
      });
      expect(result.id).toBe(999);
    });

    it('uses null for missing id', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        method: 'initialize',
      });
      expect(result.id).toBeNull();
    });
  });
});
