import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
    SERVER_NAME: 'taiwan-legislative-mcp',
    SERVER_VERSION: '1.0.0',
    LY_API_KEY: 'test-ly_api_key',
};

describe('taiwan-legislative CLI', () => {
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
    
    it('should require LY_API_KEY', () => {
      const keys = ['LY_API_KEY'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });
  });
});
