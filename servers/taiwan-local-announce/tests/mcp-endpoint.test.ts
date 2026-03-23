import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/clients/index.js', () => ({
  fetchCityAnnouncements: vi.fn(),
  fetchAllCityAnnouncements: vi.fn(),
}));

import { fetchCityAnnouncements, fetchAllCityAnnouncements } from '../src/clients/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env, LocalAnnouncement } from '../src/types.js';

const mockFetchCity = vi.mocked(fetchCityAnnouncements);
const mockFetchAll = vi.mocked(fetchAllCityAnnouncements);

const env: Env = { SERVER_NAME: 'taiwan-local-announce', SERVER_VERSION: '1.0.0' };

const sampleData: LocalAnnouncement[] = [
  {
    title: '測試公告',
    date: '2024-03-15',
    content: '公告內容',
    city: 'taipei',
    agency: '新聞處',
    category: '市政',
    url: 'https://example.com/1',
  },
];

describe('MCP SDK endpoint', () => {
  let client: Client;

  beforeEach(async () => {
    mockFetchCity.mockReset();
    mockFetchAll.mockReset();

    const server = createMcpServer(env);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
  });

  it('lists all 5 tools', async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(5);
    const names = result.tools.map((t) => t.name);
    expect(names).toContain('list_local_announcements');
    expect(names).toContain('search_local_announcements');
    expect(names).toContain('get_local_announcements_by_agency');
    expect(names).toContain('get_local_announce_stats');
    expect(names).toContain('list_supported_cities');
  });

  it('calls list_local_announcements with city', async () => {
    mockFetchCity.mockResolvedValueOnce(sampleData);
    const result = await client.callTool({
      name: 'list_local_announcements',
      arguments: { city: 'taipei' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_local_announcements', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleData);
    const result = await client.callTool({
      name: 'search_local_announcements',
      arguments: { keyword: '測試' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_local_announcements_by_agency', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleData);
    const result = await client.callTool({
      name: 'get_local_announcements_by_agency',
      arguments: { agency: '新聞處' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_local_announce_stats', async () => {
    mockFetchCity.mockResolvedValue([]);
    const result = await client.callTool({
      name: 'get_local_announce_stats',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls list_supported_cities', async () => {
    const result = await client.callTool({
      name: 'list_supported_cities',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ text: string }>)[0].text;
    expect(text).toContain('taipei');
    expect(text).toContain('台北市');
  });

  it('returns error for empty keyword', async () => {
    const result = await client.callTool({
      name: 'search_local_announcements',
      arguments: { keyword: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('returns server info', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-local-announce');
  });
});
