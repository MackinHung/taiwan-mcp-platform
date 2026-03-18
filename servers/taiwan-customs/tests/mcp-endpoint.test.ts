import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  CUSTOMS_BASE: 'https://opendata.customs.gov.tw',
  TRADE_BASE: 'https://www.trade.gov.tw/OpenData/getOpenData.aspx',
  OPENDATA_BASE: 'https://data.gov.tw/api/v2/rest/datastore',
  fetchCustomsData: vi.fn(),
  fetchTradeData: vi.fn(),
  fetchOpenData: vi.fn(),
  parseCsv: vi.fn(),
  fetchTradeStats: vi.fn(),
  fetchTraders: vi.fn(),
  fetchTariffs: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchTradeStats, fetchTraders, fetchTariffs } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchTradeStats = vi.mocked(fetchTradeStats);
const mockFetchTraders = vi.mocked(fetchTraders);
const mockFetchTariffs = vi.mocked(fetchTariffs);

const env: Env = {
  SERVER_NAME: 'taiwan-customs',
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
      'get_top_trade_partners',
      'get_trade_statistics',
      'lookup_hs_code',
      'lookup_tariff',
      'lookup_trader',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const trade = tools.find((t) => t.name === 'get_trade_statistics')!;
    expect(trade.inputSchema.type).toBe('object');
    expect(trade.inputSchema.properties).toHaveProperty('year');

    const hs = tools.find((t) => t.name === 'lookup_hs_code')!;
    expect(hs.inputSchema.type).toBe('object');
    expect(hs.inputSchema.properties).toHaveProperty('code');
  });

  it('calls get_trade_statistics with params', async () => {
    mockFetchTradeStats.mockResolvedValueOnce([
      {
        年月: '2024-01',
        國家: '美國',
        貨品名稱: '積體電路',
        貨品號列: '8542',
        進口值: '1000000',
        出口值: '5000000',
        單位: '千美元',
      },
    ]);

    const result = await client.callTool({
      name: 'get_trade_statistics',
      arguments: { year: '2024', country: '美國' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls lookup_trader with required keyword', async () => {
    mockFetchTraders.mockResolvedValueOnce([
      {
        統一編號: '22099131',
        廠商名稱: '台積電',
        廠商地址: '新竹市',
        電話: '03-5636688',
        登記日期: '19870221',
        營業項目: '積體電路製造',
      },
    ]);

    const result = await client.callTool({
      name: 'lookup_trader',
      arguments: { keyword: '台積電' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchTradeStats.mockRejectedValueOnce(new Error('Customs API timeout'));

    const result = await client.callTool({
      name: 'get_trade_statistics',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('Customs API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-customs');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_top_trade_partners without params', async () => {
    mockFetchTradeStats.mockResolvedValueOnce([
      {
        年月: '2024',
        國家: '日本',
        出口值: '3000000',
        進口值: '2000000',
      },
    ]);

    const result = await client.callTool({
      name: 'get_top_trade_partners',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls lookup_hs_code with required code', async () => {
    const result = await client.callTool({
      name: 'lookup_hs_code',
      arguments: { code: '8471' },
    });
    expect(result.isError).toBeFalsy();
  });
});
