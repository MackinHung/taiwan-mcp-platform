import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  HOLIDAY_RESOURCE_ID: '382000000A-000077-001',
  buildUrl: vi.fn(),
  fetchHolidays: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchHolidays } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchHolidays = vi.mocked(fetchHolidays);

const env: Env = {
  SERVER_NAME: 'taiwan-calendar',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchHolidays.mockReset();
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
      'convert_to_lunar',
      'convert_to_solar',
      'count_business_days',
      'get_holidays',
      'is_business_day',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const holidays = tools.find((t) => t.name === 'get_holidays')!;
    expect(holidays.inputSchema.type).toBe('object');
    expect(holidays.inputSchema.properties).toHaveProperty('year');

    const countDays = tools.find((t) => t.name === 'count_business_days')!;
    expect(countDays.inputSchema.type).toBe('object');
    expect(countDays.inputSchema.properties).toHaveProperty('startDate');
    expect(countDays.inputSchema.properties).toHaveProperty('endDate');
  });

  it('calls get_holidays with year param', async () => {
    mockFetchHolidays.mockResolvedValueOnce({
      records: [
        { '西元日期': '2026/1/1', '名稱': '元旦', '是否放假': '是' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_holidays',
      arguments: { year: 2026 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('元旦');
  });

  it('calls convert_to_lunar with date param', async () => {
    const result = await client.callTool({
      name: 'convert_to_lunar',
      arguments: { date: '2026-01-01' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.lunarYear).toBeDefined();
    expect(parsed.zodiac).toBeDefined();
  });

  it('calls convert_to_solar with lunar params', async () => {
    const result = await client.callTool({
      name: 'convert_to_solar',
      arguments: { lunarYear: 2025, lunarMonth: 1, lunarDay: 1 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.solarDate).toBe('2025-01-29');
  });

  it('handles tool error gracefully', async () => {
    const result = await client.callTool({
      name: 'get_holidays',
      arguments: { year: 0 },
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-calendar');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls is_business_day with date param', async () => {
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await client.callTool({
      name: 'is_business_day',
      arguments: { date: '2026-03-18' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.isBusinessDay).toBe(true);
  });

  it('calls count_business_days with date range', async () => {
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await client.callTool({
      name: 'count_business_days',
      arguments: { startDate: '2026-03-16', endDate: '2026-03-20' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.businessDays).toBe(5);
  });
});
