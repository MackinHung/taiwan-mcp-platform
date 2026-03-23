import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  fetchMuseumData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchMuseumData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchMuseumData = vi.mocked(fetchMuseumData);

const env: Env = {
  SERVER_NAME: 'taiwan-museum',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchMuseumData.mockReset();
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
      'get_exhibition_details',
      'get_museum_details',
      'get_upcoming_exhibitions',
      'search_exhibitions',
      'search_museums',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchMuseums = tools.find((t) => t.name === 'search_museums')!;
    expect(searchMuseums.inputSchema.type).toBe('object');
    expect(searchMuseums.inputSchema.properties).toHaveProperty('keyword');
    expect(searchMuseums.inputSchema.properties).toHaveProperty('limit');

    const details = tools.find((t) => t.name === 'get_exhibition_details')!;
    expect(details.inputSchema.type).toBe('object');
    expect(details.inputSchema.properties).toHaveProperty('title');
  });

  it('calls search_museums with keyword param', async () => {
    mockFetchMuseumData.mockResolvedValueOnce([
      {
        title: '故宮國寶特展',
        showInfo: [{ locationName: '國立故宮博物院', location: '台北市' }],
        showUnit: '國立故宮博物院',
        location: '台北市',
        sourceWebPromote: 'https://www.npm.gov.tw',
      },
    ]);

    const result = await client.callTool({
      name: 'search_museums',
      arguments: { keyword: '故宮' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_museum_details with name param', async () => {
    mockFetchMuseumData.mockResolvedValueOnce([
      {
        title: '故宮國寶特展',
        showInfo: [{ locationName: '國立故宮博物院', location: '台北市' }],
        showUnit: '國立故宮博物院',
        sourceWebPromote: 'https://www.npm.gov.tw',
        masterUnit: ['文化部'],
        startDate: '2026-03-01',
        endDate: '2026-06-30',
      },
    ]);

    const result = await client.callTool({
      name: 'get_museum_details',
      arguments: { name: '故宮' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchMuseumData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_museums',
      arguments: { keyword: '測試' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-museum');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_exhibitions with keyword param', async () => {
    mockFetchMuseumData.mockResolvedValueOnce([
      {
        title: '故宮國寶特展',
        showInfo: [{ locationName: '國立故宮博物院' }],
        startDate: '2026-03-01',
        endDate: '2026-06-30',
        descriptionFilterHtml: '故宮國寶精選特展',
      },
    ]);

    const result = await client.callTool({
      name: 'search_exhibitions',
      arguments: { keyword: '國寶' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_exhibition_details with title param', async () => {
    mockFetchMuseumData.mockResolvedValueOnce([
      {
        title: '故宮國寶特展',
        showInfo: [{ locationName: '國立故宮博物院', location: '台北市', time: '09:00', price: '350' }],
        showUnit: '國立故宮博物院',
        startDate: '2026-03-01',
        endDate: '2026-06-30',
        descriptionFilterHtml: '故宮國寶精選特展',
        masterUnit: ['文化部'],
        sourceWebPromote: 'https://www.npm.gov.tw',
        hitRate: 5000,
        category: '6',
      },
    ]);

    const result = await client.callTool({
      name: 'get_exhibition_details',
      arguments: { title: '故宮國寶特展' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_upcoming_exhibitions', async () => {
    mockFetchMuseumData.mockResolvedValueOnce([
      {
        title: '未來展覽',
        startDate: '2027-01-01',
        endDate: '2027-06-30',
        showInfo: [{ locationName: '某博物館' }],
        showUnit: '某博物館',
        location: '台北市',
      },
    ]);

    const result = await client.callTool({
      name: 'get_upcoming_exhibitions',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });
});
