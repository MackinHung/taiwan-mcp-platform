import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  API_SOURCES: { PMS: 'pms', DATAGOV: 'datagov' },
  DATAGOV_RESOURCE_ID: '16370',
  buildPmsUrl: vi.fn(),
  buildDataGovUrl: vi.fn(),
  fetchPmsApi: vi.fn(),
  fetchDataGov: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchPmsApi } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchPmsApi = vi.mocked(fetchPmsApi);

const env: Env = {
  SERVER_NAME: 'taiwan-procurement',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchPmsApi.mockReset();
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
      'get_awarded_contracts',
      'get_recent_tenders',
      'get_tender_details',
      'search_by_agency',
      'search_tenders',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchTenders = tools.find((t) => t.name === 'search_tenders')!;
    expect(searchTenders.inputSchema.type).toBe('object');
    expect(searchTenders.inputSchema.properties).toHaveProperty('keyword');

    const tenderDetails = tools.find((t) => t.name === 'get_tender_details')!;
    expect(tenderDetails.inputSchema.type).toBe('object');
    expect(tenderDetails.inputSchema.properties).toHaveProperty('tenderId');
  });

  it('calls search_tenders with keyword param', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({
      records: [
        { tenderId: 'T-001', tenderName: '系統開發', agency: '教育部' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_tenders',
      arguments: { keyword: '系統' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls get_tender_details with required tenderId param', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({
      records: [
        { tenderId: 'T-001', tenderName: '系統開發', tenderType: '公開招標' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_tender_details',
      arguments: { tenderId: 'T-001' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchPmsApi.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_tenders',
      arguments: { keyword: '資訊' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-procurement');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_recent_tenders without params', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({
      records: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'get_recent_tenders',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_by_agency with agency param', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({
      records: [
        { tenderId: 'T-002', tenderName: '網路建設', agency: '教育部' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_by_agency',
      arguments: { agency: '教育部' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_awarded_contracts with keyword param', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({
      records: [
        { tenderId: 'T-003', tenderName: '設備採購', awardedVendor: '大台科技' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_awarded_contracts',
      arguments: { keyword: '設備' },
    });
    expect(result.isError).toBeFalsy();
  });
});
