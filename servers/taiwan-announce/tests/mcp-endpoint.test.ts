import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchAnnouncements: vi.fn(),
  getApiUrl: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchAnnouncements } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchAnnouncements = vi.mocked(fetchAnnouncements);

const env: Env = {
  SERVER_NAME: 'taiwan-announce',
  SERVER_VERSION: '1.0.0',
};

const sampleData = [
  {
    Index: 1,
    SendUnitName: '財政部',
    SendNo: '台財稅字第11300001號',
    Subject: '修正營業稅法施行細則',
    DocDate: '20240301',
    SendDate: '20240302',
    DueDate: '20240401',
  },
  {
    Index: 2,
    SendUnitName: '內政部',
    SendNo: '台內地字第11300002號',
    Subject: '都市計畫法令解釋',
    DocDate: '20240305',
    SendDate: '20240306',
    DueDate: '20240405',
  },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchAnnouncements.mockReset();

    const server = createMcpServer(env);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterEach(async () => {
    await cleanup();
  });

  it('lists exactly 5 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(5);
  });

  it('lists tools with correct names', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'get_announcement_stats',
      'get_announcements_by_agency',
      'get_announcements_by_date',
      'list_announcements',
      'search_announcements',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchTool = tools.find((t) => t.name === 'search_announcements')!;
    expect(searchTool.inputSchema.type).toBe('object');
    expect(searchTool.inputSchema.properties).toHaveProperty('keyword');

    const agencyTool = tools.find((t) => t.name === 'get_announcements_by_agency')!;
    expect(agencyTool.inputSchema.type).toBe('object');
    expect(agencyTool.inputSchema.properties).toHaveProperty('agency');
  });

  it('calls list_announcements', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);

    const result = await client.callTool({
      name: 'list_announcements',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls search_announcements with keyword param', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);

    const result = await client.callTool({
      name: 'search_announcements',
      arguments: { keyword: '營業稅' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_announcements_by_agency with agency param', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);

    const result = await client.callTool({
      name: 'get_announcements_by_agency',
      arguments: { agency: '財政部' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_announcements_by_date with date params', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);

    const result = await client.callTool({
      name: 'get_announcements_by_date',
      arguments: { start_date: '20240301' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_announcement_stats', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);

    const result = await client.callTool({
      name: 'get_announcement_stats',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchAnnouncements.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'list_announcements',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-announce');
    expect(info?.version).toBe('1.0.0');
  });
});
