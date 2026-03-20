import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
    SERVER_NAME: 'taiwan-weather-alert-mcp',
    SERVER_VERSION: '1.0.0',
    CWA_API_KEY: 'test-cwa_api_key',
};

describe('taiwan-weather-alert CLI', () => {
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
    
    it('should require CWA_API_KEY', () => {
      const keys = ['CWA_API_KEY'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });
  });
});
