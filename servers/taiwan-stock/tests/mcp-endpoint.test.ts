import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  ENDPOINTS: {
    MARKET_SUMMARY: '/exchangeReport/FMTQIK',
    MARKET_INDICES: '/exchangeReport/MI_INDEX',
    TOP_VOLUME: '/exchangeReport/MI_INDEX20',
    VALUATION: '/exchangeReport/BWIBBU_ALL',
    STOCK_DAY: '/exchangeReport/STOCK_DAY_ALL',
  },
  fetchMarketSummary: vi.fn(),
  fetchMarketIndices: vi.fn(),
  fetchTopVolume: vi.fn(),
  fetchValuation: vi.fn(),
  fetchStockDayAll: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  fetchMarketSummary,
  fetchMarketIndices,
  fetchTopVolume,
  fetchValuation,
  fetchStockDayAll,
} from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchMarketSummary = vi.mocked(fetchMarketSummary);
const mockFetchMarketIndices = vi.mocked(fetchMarketIndices);
const mockFetchTopVolume = vi.mocked(fetchTopVolume);
const mockFetchValuation = vi.mocked(fetchValuation);
const mockFetchStockDayAll = vi.mocked(fetchStockDayAll);

const env: Env = {
  SERVER_NAME: 'taiwan-stock',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchMarketSummary.mockReset();
    mockFetchMarketIndices.mockReset();
    mockFetchTopVolume.mockReset();
    mockFetchValuation.mockReset();
    mockFetchStockDayAll.mockReset();
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
      'get_market_indices',
      'get_market_overview',
      'get_stock_info',
      'get_stock_search',
      'get_top_volume',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const indices = tools.find((t) => t.name === 'get_market_indices')!;
    expect(indices.inputSchema.type).toBe('object');
    expect(indices.inputSchema.properties).toHaveProperty('keyword');

    const overview = tools.find((t) => t.name === 'get_market_overview')!;
    expect(overview.inputSchema.type).toBe('object');
  });

  it('calls get_market_overview with mock data', async () => {
    mockFetchMarketSummary.mockResolvedValueOnce([
      {
        Date: '113/03/18',
        TradeVolume: '5000000000',
        TradeValue: '200000000000',
        Transaction: '1500000',
        TAIEX: '19500.00',
        Change: '+150.00',
      },
    ]);

    const result = await client.callTool({
      name: 'get_market_overview',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('19500.00');
  });

  it('calls get_stock_info with required code param', async () => {
    mockFetchValuation.mockResolvedValueOnce([
      {
        Date: '113/03/18',
        Code: '2330',
        Name: '台積電',
        PEratio: '25.00',
        DividendYield: '1.50',
        PBratio: '6.00',
      },
    ]);
    mockFetchStockDayAll.mockResolvedValueOnce([
      {
        Date: '113/03/18',
        Code: '2330',
        Name: '台積電',
        TradeVolume: '30000000',
        TradeValue: '24000000000',
        OpeningPrice: '800',
        HighestPrice: '810',
        LowestPrice: '795',
        ClosingPrice: '805',
        Change: '+5.00',
        Transaction: '45000',
      },
    ]);

    const result = await client.callTool({
      name: 'get_stock_info',
      arguments: { code: '2330' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('台積電');
  });

  it('handles tool error gracefully', async () => {
    mockFetchMarketSummary.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_market_overview',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-stock');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_top_volume without params', async () => {
    mockFetchTopVolume.mockResolvedValueOnce([
      {
        Date: '113/03/18',
        Rank: '1',
        Code: '2330',
        Name: '台積電',
        TradeVolume: '30000000',
        Transaction: '45000',
        OpeningPrice: '800',
        HighestPrice: '810',
        LowestPrice: '795',
        ClosingPrice: '805',
        Dir: '+',
        Change: '5.00',
        LastBestBidPrice: '805',
        LastBestAskPrice: '806',
      },
    ]);

    const result = await client.callTool({
      name: 'get_top_volume',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_stock_search with required keyword', async () => {
    mockFetchStockDayAll.mockResolvedValueOnce([
      {
        Date: '113/03/18',
        Code: '2330',
        Name: '台積電',
        TradeVolume: '30000000',
        TradeValue: '24000000000',
        OpeningPrice: '800',
        HighestPrice: '810',
        LowestPrice: '795',
        ClosingPrice: '805',
        Change: '+5.00',
        Transaction: '45000',
      },
    ]);

    const result = await client.callTool({
      name: 'get_stock_search',
      arguments: { keyword: '台積' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('台積電');
  });
});
