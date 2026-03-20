#!/usr/bin/env node
/**
 * CLI entry point for @formosa-mcp/taiwan-transit
 * Runs the MCP server over stdio transport.
 *
 * Usage:
 *   npx @formosa-mcp/taiwan-transit
 *   TDX_CLIENT_ID=xxx TDX_CLIENT_SECRET=xxx npx @formosa-mcp/taiwan-transit
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

// Validate required environment variables
const missing = ['TDX_CLIENT_ID', 'TDX_CLIENT_SECRET']
  .filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('Set them before running this server.');
  process.exit(1);
}

const env = {
  SERVER_NAME: 'taiwan-transit-mcp',
  SERVER_VERSION: '1.0.0',
  TDX_CLIENT_ID: process.env.TDX_CLIENT_ID ?? '',
  TDX_CLIENT_SECRET: process.env.TDX_CLIENT_SECRET ?? '',
};

const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
