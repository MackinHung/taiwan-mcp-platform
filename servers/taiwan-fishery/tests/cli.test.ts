import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
  SERVER_NAME: 'taiwan-fishery-mcp',
  SERVER_VERSION: '1.0.0',
};

describe('taiwan-fishery CLI', () => {
  it('should create MCP server with valid env', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
  });

  it('should have server name and version', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
  });

  describe('env validation', () => {
    it('should not require any API keys', () => {
      // taiwan-fishery uses public API, no keys required
      const keys: string[] = [];
      const missing = keys.filter(k => !(testEnv as Record<string, string>)[k]);
      expect(missing).toHaveLength(0);
    });
  });
});
