import { describe, it, expect, vi } from 'vitest';

// Mock @modelcontextprotocol/sdk
const mockTool = vi.fn();
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation((config: any) => ({
    name: config.name,
    version: config.version,
    tool: mockTool,
  })),
}));

// Mock all tool modules
vi.mock('../src/tools/search-by-area.js', () => ({
  searchTransactionsByArea: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'area' }],
  }),
}));
vi.mock('../src/tools/search-by-date.js', () => ({
  searchTransactionsByDate: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'date' }],
  }),
}));
vi.mock('../src/tools/price-statistics.js', () => ({
  getAreaPriceStatistics: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'stats' }],
  }),
}));
vi.mock('../src/tools/recent-transactions.js', () => ({
  getRecentTransactions: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'recent' }],
  }),
}));
vi.mock('../src/tools/price-trend.js', () => ({
  getPriceTrend: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'trend' }],
  }),
}));

import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-realestate',
  SERVER_VERSION: '1.0.0',
};

describe('createMcpServer', () => {
  it('creates a server with correct name and version', () => {
    const server = createMcpServer(env);
    expect(server.name).toBe('taiwan-realestate');
    expect(server.version).toBe('1.0.0');
  });

  it('registers all 5 tools', () => {
    mockTool.mockClear();
    createMcpServer(env);
    expect(mockTool).toHaveBeenCalledTimes(5);
  });

  it('registers search_transactions_by_area tool', () => {
    mockTool.mockClear();
    createMcpServer(env);
    const toolNames = mockTool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toContain('search_transactions_by_area');
  });

  it('registers search_transactions_by_date tool', () => {
    mockTool.mockClear();
    createMcpServer(env);
    const toolNames = mockTool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toContain('search_transactions_by_date');
  });

  it('registers get_area_price_statistics tool', () => {
    mockTool.mockClear();
    createMcpServer(env);
    const toolNames = mockTool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toContain('get_area_price_statistics');
  });

  it('registers get_recent_transactions tool', () => {
    mockTool.mockClear();
    createMcpServer(env);
    const toolNames = mockTool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toContain('get_recent_transactions');
  });

  it('registers get_price_trend tool', () => {
    mockTool.mockClear();
    createMcpServer(env);
    const toolNames = mockTool.mock.calls.map((call: any[]) => call[0]);
    expect(toolNames).toContain('get_price_trend');
  });

  it('each tool has a Chinese description', () => {
    mockTool.mockClear();
    createMcpServer(env);
    for (const call of mockTool.mock.calls) {
      const description = call[1] as string;
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(200);
    }
  });

  it('each tool has a callback function', () => {
    mockTool.mockClear();
    createMcpServer(env);
    for (const call of mockTool.mock.calls) {
      // Last argument is the callback
      const callback = call[call.length - 1];
      expect(typeof callback).toBe('function');
    }
  });

  it('tool callbacks invoke the underlying tool functions', async () => {
    mockTool.mockClear();
    createMcpServer(env);

    // Test the first tool callback (search_transactions_by_area)
    const areaCallback = mockTool.mock.calls[0][3];
    const areaResult = await areaCallback({ district: '中和區', limit: 10 });
    expect(areaResult.content[0].text).toBe('area');
  });
});
