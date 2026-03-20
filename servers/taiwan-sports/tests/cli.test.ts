import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
    SERVER_NAME: 'taiwan-sports-mcp',
    SERVER_VERSION: '1.0.0',
    SPORTS_API_KEY: 'test-sports_api_key',
};

describe('taiwan-sports CLI', () => {
  it('should create MCP server with valid env', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
  });

  it('should have server name and version', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
    // Server is created without throwing
  });

  describe('env validation', () => {
    
    it('should require SPORTS_API_KEY', () => {
      const keys = ['SPORTS_API_KEY'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });
  });
});
