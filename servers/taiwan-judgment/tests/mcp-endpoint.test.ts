import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  searchJudgments: vi.fn(),
  getJudgmentById: vi.fn(),
  searchByCourt: vi.fn(),
  searchByCaseType: vi.fn(),
  getRecentJudgments: vi.fn(),
  CASE_TYPE_MAP: {
    civil: '民事',
    criminal: '刑事',
    administrative: '行政',
  },
  buildUrl: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { searchJudgments, getJudgmentById, searchByCourt, searchByCaseType, getRecentJudgments } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockSearchJudgments = vi.mocked(searchJudgments);
const mockGetJudgmentById = vi.mocked(getJudgmentById);
const mockSearchByCourt = vi.mocked(searchByCourt);
const mockSearchByCaseType = vi.mocked(searchByCaseType);
const mockGetRecentJudgments = vi.mocked(getRecentJudgments);

const env: Env = {
  SERVER_NAME: 'taiwan-judgment',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockSearchJudgments.mockReset();
    mockGetJudgmentById.mockReset();
    mockSearchByCourt.mockReset();
    mockSearchByCaseType.mockReset();
    mockGetRecentJudgments.mockReset();

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
      'get_judgment_by_id',
      'get_recent_judgments',
      'search_by_case_type',
      'search_by_court',
      'search_judgments',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchTool = tools.find((t) => t.name === 'search_judgments')!;
    expect(searchTool.inputSchema.type).toBe('object');
    expect(searchTool.inputSchema.properties).toHaveProperty('keyword');

    const courtTool = tools.find((t) => t.name === 'search_by_court')!;
    expect(courtTool.inputSchema.type).toBe('object');
    expect(courtTool.inputSchema.properties).toHaveProperty('court');
  });

  it('calls search_judgments with keyword param', async () => {
    mockSearchJudgments.mockResolvedValueOnce({
      judgments: [
        { id: '1', court: '最高法院', caseType: '刑事', caseNo: '112台上1234', date: '2023-06-01', title: '詐欺案' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_judgments',
      arguments: { keyword: '詐欺' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls get_judgment_by_id with id param', async () => {
    mockGetJudgmentById.mockResolvedValueOnce({
      id: '112台上1234',
      court: '最高法院',
      caseType: '刑事',
      caseNo: '112台上1234',
      date: '2023-06-01',
      title: '詐欺案',
      content: '主文...',
    });

    const result = await client.callTool({
      name: 'get_judgment_by_id',
      arguments: { id: '112台上1234' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockSearchJudgments.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_judgments',
      arguments: { keyword: '詐欺' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-judgment');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_by_court with court param', async () => {
    mockSearchByCourt.mockResolvedValueOnce({
      judgments: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'search_by_court',
      arguments: { court: '最高法院' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_recent_judgments without params', async () => {
    mockGetRecentJudgments.mockResolvedValueOnce({
      judgments: [
        { id: '1', court: '最高法院', caseType: '刑事', caseNo: '113台上1', date: '2024-01-01', title: '最新案件' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_recent_judgments',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });
});
