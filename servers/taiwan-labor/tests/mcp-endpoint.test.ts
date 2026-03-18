import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  RESOURCE_IDS: {
    WAGE_STATISTICS: '6415',
  },
  buildUrl: vi.fn(),
  fetchOpenData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchOpenData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchOpenData = vi.mocked(fetchOpenData);

const env: Env = {
  SERVER_NAME: 'taiwan-labor',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchOpenData.mockReset();
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
      'get_labor_insurance_info',
      'get_labor_law_info',
      'get_minimum_wage',
      'get_pension_info',
      'get_wage_statistics',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const insurance = tools.find((t) => t.name === 'get_labor_insurance_info')!;
    expect(insurance.inputSchema.type).toBe('object');
    expect(insurance.inputSchema.properties).toHaveProperty('salary');

    const wage = tools.find((t) => t.name === 'get_minimum_wage')!;
    expect(wage.inputSchema.type).toBe('object');
  });

  it('calls get_minimum_wage (no params)', async () => {
    const result = await client.callTool({
      name: 'get_minimum_wage',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls get_labor_insurance_info with salary', async () => {
    const result = await client.callTool({
      name: 'get_labor_insurance_info',
      arguments: { salary: 45800 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('handles tool error gracefully', async () => {
    mockFetchOpenData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_wage_statistics',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-labor');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_pension_info with salary and years', async () => {
    const result = await client.callTool({
      name: 'get_pension_info',
      arguments: { salary: 50000, years: 10 },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_labor_law_info with topic', async () => {
    const result = await client.callTool({
      name: 'get_labor_law_info',
      arguments: { topic: '加班' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('加班');
  });
});
