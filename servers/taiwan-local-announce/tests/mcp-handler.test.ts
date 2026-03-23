import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/tools/list.js', () => ({
  listLocalAnnouncementsTool: vi
    .fn()
    .mockResolvedValue({ content: [{ type: 'text', text: 'list-result' }] }),
}));
vi.mock('../src/tools/search.js', () => ({
  searchLocalAnnouncementsTool: vi
    .fn()
    .mockResolvedValue({ content: [{ type: 'text', text: 'search-result' }] }),
}));
vi.mock('../src/tools/by-agency.js', () => ({
  getLocalAnnouncementsByAgencyTool: vi
    .fn()
    .mockResolvedValue({ content: [{ type: 'text', text: 'agency-result' }] }),
}));
vi.mock('../src/tools/stats.js', () => ({
  getLocalAnnounceStatsTool: vi
    .fn()
    .mockResolvedValue({ content: [{ type: 'text', text: 'stats-result' }] }),
}));
vi.mock('../src/tools/cities.js', () => ({
  listSupportedCitiesTool: vi
    .fn()
    .mockResolvedValue({ content: [{ type: 'text', text: 'cities-result' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';

const env: Env = { SERVER_NAME: 'taiwan-local-announce', SERVER_VERSION: '1.0.0' };

describe('handleRpcRequest', () => {
  // initialize
  it('returns server info on initialize', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    });
    expect(res.jsonrpc).toBe('2.0');
    expect(res.id).toBe(1);
    const result = res.result as Record<string, unknown>;
    expect(result.protocolVersion).toBe('2024-11-05');
    const info = result.serverInfo as Record<string, unknown>;
    expect(info.name).toBe('taiwan-local-announce');
    expect(info.version).toBe('1.0.0');
  });

  it('returns capabilities with tools', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: {},
    });
    const result = res.result as Record<string, unknown>;
    expect(result.capabilities).toEqual({ tools: {} });
  });

  // tools/list
  it('lists all 5 tools', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
      params: {},
    });
    const result = res.result as { tools: unknown[] };
    expect(result.tools).toHaveLength(5);
  });

  it('tool definitions have name, description, inputSchema', async () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  // tools/call
  it('calls list_local_announcements', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'list_local_announcements', arguments: {} },
    });
    expect(res.error).toBeUndefined();
    const result = res.result as { content: Array<{ text: string }> };
    expect(result.content[0].text).toBe('list-result');
  });

  it('calls search_local_announcements', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'search_local_announcements',
        arguments: { keyword: 'test' },
      },
    });
    expect(res.error).toBeUndefined();
    const result = res.result as { content: Array<{ text: string }> };
    expect(result.content[0].text).toBe('search-result');
  });

  it('calls get_local_announcements_by_agency', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_local_announcements_by_agency',
        arguments: { agency: '交通局' },
      },
    });
    const result = res.result as { content: Array<{ text: string }> };
    expect(result.content[0].text).toBe('agency-result');
  });

  it('calls get_local_announce_stats', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'get_local_announce_stats', arguments: {} },
    });
    const result = res.result as { content: Array<{ text: string }> };
    expect(result.content[0].text).toBe('stats-result');
  });

  it('calls list_supported_cities', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'list_supported_cities', arguments: {} },
    });
    const result = res.result as { content: Array<{ text: string }> };
    expect(result.content[0].text).toBe('cities-result');
  });

  // Error cases
  it('returns -32601 for unknown tool', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: { name: 'nonexistent', arguments: {} },
    });
    expect(res.error?.code).toBe(-32601);
    expect(res.error?.message).toContain('nonexistent');
  });

  it('returns -32601 for unknown method', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 10,
      method: 'unknown/method',
      params: {},
    });
    expect(res.error?.code).toBe(-32601);
  });

  it('returns -32600 for missing jsonrpc version', async () => {
    const res = await handleRpcRequest(env, {
      id: 11,
      method: 'initialize',
    });
    expect(res.error?.code).toBe(-32600);
  });

  it('returns -32600 for wrong jsonrpc version', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '1.0',
      id: 12,
      method: 'initialize',
    });
    expect(res.error?.code).toBe(-32600);
  });

  it('returns -32600 for missing method', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 13,
    });
    expect(res.error?.code).toBe(-32600);
  });

  it('uses null id when id is missing', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      method: 'initialize',
    });
    expect(res.id).toBeNull();
  });

  it('preserves string id', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 'abc',
      method: 'initialize',
    });
    expect(res.id).toBe('abc');
  });

  it('handles tools/call with no arguments', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 14,
      method: 'tools/call',
      params: { name: 'list_supported_cities' },
    });
    expect(res.error).toBeUndefined();
  });

  // Tool definitions validation
  it('has city enum in list tool schema', () => {
    const listTool = TOOL_DEFINITIONS.find(
      (t) => t.name === 'list_local_announcements'
    );
    expect(listTool?.inputSchema.properties.city.enum).toEqual([
      'taipei', 'newtaipei', 'taoyuan', 'taichung', 'tainan', 'kaohsiung',
    ]);
  });

  it('search tool requires keyword', () => {
    const searchTool = TOOL_DEFINITIONS.find(
      (t) => t.name === 'search_local_announcements'
    );
    expect(searchTool?.inputSchema.required).toContain('keyword');
  });

  it('agency tool requires agency', () => {
    const agencyTool = TOOL_DEFINITIONS.find(
      (t) => t.name === 'get_local_announcements_by_agency'
    );
    expect(agencyTool?.inputSchema.required).toContain('agency');
  });

  it('stats tool has no required params', () => {
    const statsTool = TOOL_DEFINITIONS.find(
      (t) => t.name === 'get_local_announce_stats'
    );
    expect(statsTool?.inputSchema.required).toEqual([]);
  });

  it('cities tool has no required params', () => {
    const citiesTool = TOOL_DEFINITIONS.find(
      (t) => t.name === 'list_supported_cities'
    );
    expect(citiesTool?.inputSchema.required).toEqual([]);
  });
});
