import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/aqi.js', () => ({
  getAqi: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'aqi-data' }],
  }),
  getStationDetail: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'station-detail' }],
  }),
}));

vi.mock('../src/tools/ranking.js', () => ({
  getPm25Ranking: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'pm25-ranking' }],
  }),
}));

vi.mock('../src/tools/alert.js', () => ({
  getUnhealthyStations: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'unhealthy-stations' }],
  }),
  getCountySummary: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'county-summary' }],
  }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = {
  MOENV_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-air-quality',
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
      expect(info.name).toBe('taiwan-air-quality');
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
      expect(names).toContain('get_aqi');
      expect(names).toContain('get_station_detail');
      expect(names).toContain('get_unhealthy_stations');
      expect(names).toContain('get_pm25_ranking');
      expect(names).toContain('get_county_summary');
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
    it('routes get_aqi to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_aqi', arguments: { county: '臺北市' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('aqi-data');
    });

    it('routes get_station_detail to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_station_detail', arguments: { station: '松山' } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('station-detail');
    });

    it('routes get_pm25_ranking to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_pm25_ranking', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('pm25-ranking');
    });

    it('routes get_unhealthy_stations to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'get_unhealthy_stations', arguments: { threshold: 100 } },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('unhealthy-stations');
    });

    it('routes get_county_summary to handler', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_county_summary', arguments: {} },
      });
      const r = result.result as { content: Array<{ text: string }> };
      expect(r.content[0].text).toBe('county-summary');
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
