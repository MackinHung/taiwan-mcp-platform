import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/forecast.js', () => ({
  getForecast36hr: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'forecast36' }] }),
  getForecast7day: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'forecast7d' }] }),
}));
vi.mock('../src/tools/earthquake.js', () => ({
  getEarthquakeRecent: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'earthquake' }] }),
}));
vi.mock('../src/tools/typhoon.js', () => ({
  getTyphoonActive: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'typhoon' }] }),
}));
vi.mock('../src/tools/warning.js', () => ({
  getWeatherWarning: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'warning' }] }),
}));
vi.mock('../src/tools/rain.js', () => ({
  getRainObservation: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'rain' }] }),
}));
vi.mock('../src/tools/tidal.js', () => ({
  getTidalForecast: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'tidal' }] }),
}));
vi.mock('../src/tools/uv.js', () => ({
  getUvIndex: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'uv' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  CWA_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-weather',
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
      expect(result.result.protocolVersion).toBe('2024-11-05');
      expect(result.result.serverInfo.name).toBe('taiwan-weather');
      expect(result.result.serverInfo.version).toBe('1.0.0');
      expect(result.result.capabilities).toHaveProperty('tools');
    });
  });

  describe('tools/list', () => {
    it('returns all 8 tools with correct schemas', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      });
      expect(result.result.tools).toHaveLength(8);
      const names = result.result.tools.map((t: any) => t.name);
      expect(names).toContain('get_forecast_36hr');
      expect(names).toContain('get_forecast_7day');
      expect(names).toContain('get_earthquake_recent');
      expect(names).toContain('get_typhoon_active');
      expect(names).toContain('get_weather_warning');
      expect(names).toContain('get_rain_observation');
      expect(names).toContain('get_tidal_forecast');
      expect(names).toContain('get_uv_index');

      // Verify each tool has inputSchema
      for (const tool of result.result.tools) {
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
        params: { name: 'get_forecast_36hr', arguments: { city: '臺北市' } },
      });
      expect(result.result.content[0].text).toBe('forecast36');
    });

    it('returns MethodNotFound for invalid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32601);
      expect(result.error.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'get_forecast_36hr', 'get_forecast_7day', 'get_earthquake_recent',
        'get_typhoon_active', 'get_weather_warning', 'get_rain_observation',
        'get_tidal_forecast', 'get_uv_index',
      ];
      for (const name of toolNames) {
        const result = await handleRpcRequest(env, {
          jsonrpc: '2.0', id: 100, method: 'tools/call',
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
        id: 5,
        method: 'initialize',
      });
      expect(result.error.code).toBe(-32600);
      expect(result.error.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
      });
      expect(result.error.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'unknown/method',
      });
      expect(result.error.code).toBe(-32601);
      expect(result.error.message).toContain('unknown/method');
    });
  });
});

describe('TOOL_DEFINITIONS', () => {
  it('has 8 tool definitions', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(8);
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
