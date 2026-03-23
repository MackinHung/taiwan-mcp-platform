import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/clients/index.js', () => ({
  fetchCityAnnouncements: vi.fn().mockResolvedValue([]),
  fetchAllCityAnnouncements: vi.fn().mockResolvedValue([]),
}));

import { createMcpServer } from '../src/mcp-server.js';

describe('taiwan-local-announce CLI', () => {
  it('creates MCP server with valid env', () => {
    const server = createMcpServer({
      SERVER_NAME: 'taiwan-local-announce-mcp',
      SERVER_VERSION: '1.0.0',
    });
    expect(server).toBeDefined();
  });

  it('server has tool registration methods', () => {
    const server = createMcpServer({
      SERVER_NAME: 'test',
      SERVER_VERSION: '1.0.0',
    });
    expect(typeof server.connect).toBe('function');
  });
});
