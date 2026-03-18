import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  TIPO_BASE: 'https://tiponet.tipo.gov.tw/datagov',
  OPENDATA_BASE: 'https://data.gov.tw/api/v2/rest/datastore',
  TIPO_PATHS: {
    PATENT: '/patent_open_data.csv',
    TRADEMARK: '/trademark_open_data.csv',
  },
  OPENDATA_RESOURCES: {
    IP_STATISTICS: '6b2e5542-44e3-4e12-8a3e-58f1ef896ea3',
  },
  parseCsv: vi.fn(),
  buildTipoUrl: vi.fn(),
  buildOpenDataUrl: vi.fn(),
  fetchTipoCsv: vi.fn(),
  fetchOpenData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchTipoCsv, fetchOpenData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchTipoCsv = vi.mocked(fetchTipoCsv);
const mockFetchOpenData = vi.mocked(fetchOpenData);

const env: Env = {
  SERVER_NAME: 'taiwan-patent',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
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
      'get_filing_guide',
      'get_ip_statistics',
      'get_patent_classification',
      'search_patents',
      'search_trademarks',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const patents = tools.find((t) => t.name === 'search_patents')!;
    expect(patents.inputSchema.type).toBe('object');
    expect(patents.inputSchema.properties).toHaveProperty('keyword');

    const guide = tools.find((t) => t.name === 'get_filing_guide')!;
    expect(guide.inputSchema.type).toBe('object');
  });

  it('calls search_patents with keyword', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce([
      {
        專利名稱: '半導體裝置',
        申請號: '110101234',
        申請人: '台積電',
        申請日: '2021-01-01',
        IPC分類: 'H01L',
      },
    ]);

    const result = await client.callTool({
      name: 'search_patents',
      arguments: { keyword: '半導體' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('半導體');
  });

  it('calls search_trademarks with required keyword', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce([
      {
        商標名稱: 'TestMark',
        申請號: 'TM001',
        申請人: '測試公司',
        類別: '09',
        申請日: '2024-01-01',
      },
    ]);

    const result = await client.callTool({
      name: 'search_trademarks',
      arguments: { keyword: 'TestMark' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchTipoCsv.mockRejectedValueOnce(new Error('TIPO API timeout'));

    const result = await client.callTool({
      name: 'search_patents',
      arguments: { keyword: '半導體' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('TIPO API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-patent');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_filing_guide without params', async () => {
    const result = await client.callTool({
      name: 'get_filing_guide',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_patent_classification with required code', async () => {
    const result = await client.callTool({
      name: 'get_patent_classification',
      arguments: { code: 'H04L' },
    });
    expect(result.isError).toBeFalsy();
  });
});
