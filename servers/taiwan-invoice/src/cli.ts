#!/usr/bin/env node
/**
 * CLI entry point for @formosa-mcp/taiwan-invoice
 * Runs the MCP server over stdio transport.
 *
 * Usage:
 *   npx @formosa-mcp/taiwan-invoice
 *   EINVOICE_APP_ID=xxx EINVOICE_UUID=xxx npx @formosa-mcp/taiwan-invoice
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

// Validate required environment variables
const missing = ['EINVOICE_APP_ID', 'EINVOICE_UUID']
  .filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('Set them before running this server.');
  process.exit(1);
}

const env = {
  SERVER_NAME: 'taiwan-invoice-mcp',
  SERVER_VERSION: '1.0.0',
  EINVOICE_APP_ID: process.env.EINVOICE_APP_ID ?? '',
  EINVOICE_UUID: process.env.EINVOICE_UUID ?? '',
};

const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
