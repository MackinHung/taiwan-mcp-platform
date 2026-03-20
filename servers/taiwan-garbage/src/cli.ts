#!/usr/bin/env node
/**
 * CLI entry point for @formosa-mcp/taiwan-garbage
 * Runs the MCP server over stdio transport.
 *
 * Usage:
 *   npx @formosa-mcp/taiwan-garbage
 *   MOENV_API_KEY=xxx npx @formosa-mcp/taiwan-garbage
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

// Validate required environment variables
const missing = ['MOENV_API_KEY']
  .filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('Set them before running this server.');
  process.exit(1);
}

const env = {
  SERVER_NAME: 'taiwan-garbage-mcp',
  SERVER_VERSION: '1.0.0',
  MOENV_API_KEY: process.env.MOENV_API_KEY ?? '',
};

const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
