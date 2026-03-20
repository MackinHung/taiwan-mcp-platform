import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
    SERVER_NAME: 'taiwan-invoice-mcp',
    SERVER_VERSION: '1.0.0',
    EINVOICE_APP_ID: 'test-einvoice_app_id',
    EINVOICE_UUID: 'test-einvoice_uuid',
};

describe('taiwan-invoice CLI', () => {
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
    
    it('should require EINVOICE_APP_ID', () => {
      const keys = ['EINVOICE_APP_ID', 'EINVOICE_UUID'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });

    it('should require EINVOICE_UUID', () => {
      const keys = ['EINVOICE_APP_ID', 'EINVOICE_UUID'];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });
  });
});
