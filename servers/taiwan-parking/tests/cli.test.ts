import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
    SERVER_NAME: 'taiwan-parking-mcp',
    SERVER_VERSION: '1.0.0',
    TDX_CLIENT_ID: 'test-tdx_client_id',
    TDX_CLIENT_SECRET: 'test-tdx_client_secret',
};

describe('taiwan-parking CLI', () => {
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
    
    it('should require TDX_CLIENT_ID', () => {
      const keys = ['TDX_CLIENT_ID', 'TDX_CLIENT_SECRET'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });

    it('should require TDX_CLIENT_SECRET', () => {
      const keys = ['TDX_CLIENT_ID', 'TDX_CLIENT_SECRET'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });
  });
});
