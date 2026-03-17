import { describe, it, expect, vi } from 'vitest';
import { selectMode, loadAllTools, getMetaTools } from '../src/lazy-loader.js';
import type { CompositionServerEntry } from '../src/types.js';

// --- Fixtures ---

function makeServer(prefix: string, enabled = true): CompositionServerEntry {
  return {
    server_id: `srv-${prefix}`,
    server_slug: prefix,
    server_name: prefix.charAt(0).toUpperCase() + prefix.slice(1),
    namespace_prefix: prefix,
    endpoint_url: `https://${prefix}.example.com`,
    enabled,
    pinned_version: null,
  };
}

// --- selectMode ---

describe('selectMode', () => {
  it('returns "full" for 1 server', () => {
    expect(selectMode(1)).toBe('full');
  });

  it('returns "full" for 3 servers', () => {
    expect(selectMode(3)).toBe('full');
  });

  it('returns "full" for 5 servers (boundary)', () => {
    expect(selectMode(5)).toBe('full');
  });

  it('returns "lazy" for 6 servers', () => {
    expect(selectMode(6)).toBe('lazy');
  });

  it('returns "lazy" for 10 servers', () => {
    expect(selectMode(10)).toBe('lazy');
  });

  it('returns "full" for 0 servers', () => {
    expect(selectMode(0)).toBe('full');
  });
});

// --- loadAllTools ---

describe('loadAllTools', () => {
  it('returns all tools with namespace prefix (Mode A)', async () => {
    const servers = [makeServer('weather'), makeServer('transit')];
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([
        { name: 'get_forecast', description: '取得天氣預報', inputSchema: { type: 'object', properties: {} } },
      ])
      .mockResolvedValueOnce([
        { name: 'get_arrivals', description: '取得到站資訊', inputSchema: { type: 'object', properties: {} } },
      ]);

    const tools = await loadAllTools(servers, fetchFn);

    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('weather.get_forecast');
    expect(tools[1].name).toBe('transit.get_arrivals');
  });

  it('tools are correctly prefixed with namespace', async () => {
    const servers = [makeServer('weather')];
    const fetchFn = vi.fn().mockResolvedValueOnce([
      { name: 'get_forecast_36hr', description: '36小時預報', inputSchema: { type: 'object', properties: {} } },
    ]);

    const tools = await loadAllTools(servers, fetchFn);
    expect(tools[0].name).toBe('weather.get_forecast_36hr');
    expect(tools[0].original_name).toBe('get_forecast_36hr');
  });

  it('description includes namespace hint', async () => {
    const servers = [makeServer('weather')];
    const fetchFn = vi.fn().mockResolvedValueOnce([
      { name: 'get_forecast', description: '取得天氣預報', inputSchema: { type: 'object', properties: {} } },
    ]);

    const tools = await loadAllTools(servers, fetchFn);
    expect(tools[0].description).toContain('[Weather]');
    expect(tools[0].description).toContain('取得天氣預報');
  });

  it('skips disabled servers', async () => {
    const servers = [makeServer('weather'), makeServer('disabled', false)];
    const fetchFn = vi.fn().mockResolvedValueOnce([
      { name: 'get_forecast', description: 'Forecast', inputSchema: { type: 'object', properties: {} } },
    ]);

    const tools = await loadAllTools(servers, fetchFn);
    expect(tools).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('skips servers that fail to load (does not throw)', async () => {
    const servers = [makeServer('weather'), makeServer('broken')];
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([
        { name: 'get_forecast', description: 'Forecast', inputSchema: { type: 'object', properties: {} } },
      ])
      .mockRejectedValueOnce(new Error('Connection refused'));

    const tools = await loadAllTools(servers, fetchFn);
    expect(tools).toHaveLength(1);
    expect(tools[0].namespace_prefix).toBe('weather');
  });

  it('returns empty array when all servers fail', async () => {
    const servers = [makeServer('broken1'), makeServer('broken2')];
    const fetchFn = vi.fn().mockRejectedValue(new Error('fail'));

    const tools = await loadAllTools(servers, fetchFn);
    expect(tools).toEqual([]);
  });

  it('preserves server_id and namespace_prefix on each tool', async () => {
    const servers = [makeServer('weather')];
    const fetchFn = vi.fn().mockResolvedValueOnce([
      { name: 'get_forecast', description: 'Forecast', inputSchema: { type: 'object', properties: {} } },
    ]);

    const tools = await loadAllTools(servers, fetchFn);
    expect(tools[0].server_id).toBe('srv-weather');
    expect(tools[0].namespace_prefix).toBe('weather');
  });
});

// --- getMetaTools ---

describe('getMetaTools', () => {
  it('returns exactly 2 meta-tools', () => {
    const tools = getMetaTools();
    expect(tools).toHaveLength(2);
  });

  it('includes discover_tools', () => {
    const tools = getMetaTools();
    const discover = tools.find(t => t.name === 'discover_tools');
    expect(discover).toBeDefined();
    expect(discover!.description).toBeTruthy();
  });

  it('includes execute_tool', () => {
    const tools = getMetaTools();
    const execute = tools.find(t => t.name === 'execute_tool');
    expect(execute).toBeDefined();
    expect(execute!.description).toBeTruthy();
  });

  it('discover_tools has namespace filter parameter', () => {
    const tools = getMetaTools();
    const discover = tools.find(t => t.name === 'discover_tools');
    expect(discover!.inputSchema).toHaveProperty('properties');
    expect((discover!.inputSchema as any).properties).toHaveProperty('namespace');
  });

  it('execute_tool requires name parameter', () => {
    const tools = getMetaTools();
    const execute = tools.find(t => t.name === 'execute_tool');
    expect((execute!.inputSchema as any).required).toContain('name');
  });

  it('execute_tool has arguments parameter', () => {
    const tools = getMetaTools();
    const execute = tools.find(t => t.name === 'execute_tool');
    expect((execute!.inputSchema as any).properties).toHaveProperty('arguments');
  });
});
