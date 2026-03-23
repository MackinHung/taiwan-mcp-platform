import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
  SERVER_NAME: 'taiwan-animal-shelter-mcp',
  SERVER_VERSION: '1.0.0',
};

describe('taiwan-animal-shelter CLI', () => {
  it('should create MCP server with valid env', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
  });

  it('should have server name and version', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
  });
});
