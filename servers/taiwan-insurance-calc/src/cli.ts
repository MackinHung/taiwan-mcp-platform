#!/usr/bin/env node
/**
 * CLI entry point for @formosa-mcp/taiwan-insurance-calc
 * Runs the MCP server over stdio transport.
 *
 * Usage:
 *   npx @formosa-mcp/taiwan-insurance-calc
 *   
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

const env = {
  SERVER_NAME: 'taiwan-insurance-calc-mcp',
  SERVER_VERSION: '1.0.0',

};

const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
