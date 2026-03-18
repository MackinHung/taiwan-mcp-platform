import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  searchLaws: vi.fn(),
  getLawById: vi.fn(),
  getLawArticles: vi.fn(),
  getLawHistory: vi.fn(),
  getCategoryList: vi.fn(),
  buildUrl: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { searchLaws, getLawById, getLawArticles, getLawHistory, getCategoryList } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockSearchLaws = vi.mocked(searchLaws);
const mockGetLawById = vi.mocked(getLawById);
const mockGetLawArticles = vi.mocked(getLawArticles);
const mockGetLawHistory = vi.mocked(getLawHistory);
const mockGetCategoryList = vi.mocked(getCategoryList);

const env: Env = {
  SERVER_NAME: 'taiwan-law',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockSearchLaws.mockReset();
    mockGetLawById.mockReset();
    mockGetLawArticles.mockReset();
    mockGetLawHistory.mockReset();
    mockGetCategoryList.mockReset();

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
      'get_law_articles',
      'get_law_by_id',
      'get_law_history',
      'search_by_category',
      'search_laws',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchTool = tools.find((t) => t.name === 'search_laws')!;
    expect(searchTool.inputSchema.type).toBe('object');
    expect(searchTool.inputSchema.properties).toHaveProperty('keyword');

    const getLawTool = tools.find((t) => t.name === 'get_law_by_id')!;
    expect(getLawTool.inputSchema.type).toBe('object');
    expect(getLawTool.inputSchema.properties).toHaveProperty('pcode');
  });

  it('calls search_laws with keyword param', async () => {
    mockSearchLaws.mockResolvedValueOnce({
      laws: [
        { PCode: 'A0030154', LawName: '民法', LawLevel: '法律' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_laws',
      arguments: { keyword: '民法' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls get_law_by_id with pcode param', async () => {
    mockGetLawById.mockResolvedValueOnce({
      PCode: 'A0030154',
      LawName: '民法',
      LawLevel: '法律',
    });

    const result = await client.callTool({
      name: 'get_law_by_id',
      arguments: { pcode: 'A0030154' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockSearchLaws.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_laws',
      arguments: { keyword: '民法' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-law');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_law_articles with pcode', async () => {
    mockGetLawArticles.mockResolvedValueOnce([]);

    const result = await client.callTool({
      name: 'get_law_articles',
      arguments: { pcode: 'A0030154' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_law_history with pcode', async () => {
    mockGetLawHistory.mockResolvedValueOnce({
      PCode: 'A0030154',
      LawName: '民法',
      LawModifiedDate: '113.01.01',
      LawHistories: '沿革內容',
    });

    const result = await client.callTool({
      name: 'get_law_history',
      arguments: { pcode: 'A0030154' },
    });
    expect(result.isError).toBeFalsy();
  });
});
