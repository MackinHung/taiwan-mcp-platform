import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchAllAlerts: vi.fn(),
  fetchAlerts: vi.fn(),
  buildAlertUrl: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchAllAlerts } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchAllAlerts = vi.mocked(fetchAllAlerts);

const env: Env = {
  SERVER_NAME: 'taiwan-disaster',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchAllAlerts.mockReset();
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
      'get_active_alerts',
      'get_alert_history',
      'get_alerts_by_region',
      'get_alerts_by_type',
      'get_earthquake_reports',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const activeAlerts = tools.find((t) => t.name === 'get_active_alerts')!;
    expect(activeAlerts.inputSchema.type).toBe('object');
    expect(activeAlerts.inputSchema.properties).toHaveProperty('limit');

    const byType = tools.find((t) => t.name === 'get_alerts_by_type')!;
    expect(byType.inputSchema.type).toBe('object');
    expect(byType.inputSchema.properties).toHaveProperty('alertType');
  });

  it('calls get_active_alerts without params', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: [
        {
          alertId: 'A001',
          alertType: 'earthquake',
          alertTypeName: '地震',
          severity: 'moderate',
          area: '花蓮縣',
          description: '地震報告',
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_active_alerts',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('地震');
  });

  it('calls get_alerts_by_type with alertType param', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: [
        {
          alertId: 'A002',
          alertType: 'heavy_rain',
          alertTypeName: '豪雨',
          severity: 'severe',
          area: '臺北市',
          description: '豪雨特報',
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_alerts_by_type',
      arguments: { alertType: 'heavy_rain' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchAllAlerts.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_active_alerts',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-disaster');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_alerts_by_region with region param', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'get_alerts_by_region',
      arguments: { region: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_earthquake_reports with minMagnitude param', async () => {
    mockFetchAllAlerts.mockResolvedValueOnce({
      alerts: [
        {
          alertId: 'EQ1',
          alertType: 'earthquake',
          alertTypeName: '地震',
          magnitude: '5.5',
          depth: '20',
          epicenter: '花蓮近海',
          area: '花蓮縣',
          description: '地震報告',
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_earthquake_reports',
      arguments: { minMagnitude: 4 },
    });
    expect(result.isError).toBeFalsy();
  });
});
