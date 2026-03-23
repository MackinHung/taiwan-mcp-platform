#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';

const env = { SERVER_NAME: 'taiwan-water-quality-mcp', SERVER_VERSION: '1.0.0' };
const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
