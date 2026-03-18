import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-insurance-calc',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
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
      'calculate_employer_cost',
      'calculate_health_insurance',
      'calculate_labor_insurance',
      'calculate_pension',
      'get_salary_grade',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const labor = tools.find((t) => t.name === 'calculate_labor_insurance')!;
    expect(labor.inputSchema.type).toBe('object');
    expect(labor.inputSchema.properties).toHaveProperty('salary');

    const health = tools.find((t) => t.name === 'calculate_health_insurance')!;
    expect(health.inputSchema.type).toBe('object');
    expect(health.inputSchema.properties).toHaveProperty('salary');
    expect(health.inputSchema.properties).toHaveProperty('dependents');
  });

  it('calls calculate_labor_insurance with salary param', async () => {
    const result = await client.callTool({
      name: 'calculate_labor_insurance',
      arguments: { salary: 35000 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('勞保費試算結果');
    expect(text).toContain('36,300');
  });

  it('calls calculate_health_insurance with dependents', async () => {
    const result = await client.callTool({
      name: 'calculate_health_insurance',
      arguments: { salary: 40000, dependents: 2 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('健保費試算結果');
  });

  it('calls calculate_pension with voluntary rate', async () => {
    const result = await client.callTool({
      name: 'calculate_pension',
      arguments: { salary: 50000, voluntaryRate: 3 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('勞退提繳試算結果');
  });

  it('calls calculate_employer_cost', async () => {
    const result = await client.callTool({
      name: 'calculate_employer_cost',
      arguments: { salary: 45000 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('雇主總人事成本試算');
  });

  it('calls get_salary_grade', async () => {
    const result = await client.callTool({
      name: 'get_salary_grade',
      arguments: { salary: 35000 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('投保薪資級距查詢結果');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-insurance-calc');
    expect(info?.version).toBe('1.0.0');
  });

  it('handles invalid salary gracefully', async () => {
    const result = await client.callTool({
      name: 'calculate_labor_insurance',
      arguments: { salary: -5000 },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('月薪必須大於 0');
  });
});
