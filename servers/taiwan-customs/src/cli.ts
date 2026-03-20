#!/usr/bin/env node
/**
 * CLI entry point for @formosa-mcp/taiwan-customs
 * Runs the MCP server over stdio transport.
 *
 * Usage:
 *   npx @formosa-mcp/taiwan-customs
 *   
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

const env = {
  SERVER_NAME: 'taiwan-customs-mcp',
  SERVER_VERSION: '1.0.0',

};

const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
