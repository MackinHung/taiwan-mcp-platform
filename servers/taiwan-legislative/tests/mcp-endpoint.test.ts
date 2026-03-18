import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  ENDPOINTS: {
    BILLS: '/bills',
    LEGISLATORS: '/legislators',
    MEETINGS: '/meetings',
    INTERPELLATIONS: '/interpellations',
  },
  buildUrl: vi.fn(),
  fetchLyApi: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchLyApi } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchLyApi = vi.mocked(fetchLyApi);

const env: Env = {
  SERVER_NAME: 'taiwan-legislative',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchLyApi.mockReset();
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
      'get_bill_status',
      'get_interpellations',
      'get_legislator_votes',
      'search_bills',
      'search_meetings',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchBills = tools.find((t) => t.name === 'search_bills')!;
    expect(searchBills.inputSchema.type).toBe('object');
    expect(searchBills.inputSchema.properties).toHaveProperty('keyword');

    const billStatus = tools.find((t) => t.name === 'get_bill_status')!;
    expect(billStatus.inputSchema.type).toBe('object');
    expect(billStatus.inputSchema.properties).toHaveProperty('billId');
  });

  it('calls search_bills with keyword param', async () => {
    mockFetchLyApi.mockResolvedValueOnce({
      records: [
        { billNo: 'B-001', billName: '教育法', billProposer: '王委員' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_bills',
      arguments: { keyword: '教育' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls get_bill_status with required billId param', async () => {
    mockFetchLyApi.mockResolvedValueOnce({
      records: [
        { billNo: 'B-001', billName: '教育法', billStatus: '二讀' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_bill_status',
      arguments: { billId: 'B-001' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchLyApi.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_bills',
      arguments: { keyword: '教育' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-legislative');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_legislator_votes without params', async () => {
    mockFetchLyApi.mockResolvedValueOnce({
      records: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'get_legislator_votes',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_meetings with keyword param', async () => {
    mockFetchLyApi.mockResolvedValueOnce({
      records: [
        { meetingNo: 'M-001', meetingName: '教育委員會', meetingDate: '2024-03-20' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_meetings',
      arguments: { keyword: '教育' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_interpellations with legislator param', async () => {
    mockFetchLyApi.mockResolvedValueOnce({
      records: [
        { interpellationNo: 'I-001', legislator: '林委員', subject: '教育' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_interpellations',
      arguments: { legislator: '林委員' },
    });
    expect(result.isError).toBeFalsy();
  });
});
