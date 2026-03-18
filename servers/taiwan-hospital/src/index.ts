import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createMcpHandler } from 'agents/mcp';
import type { Env } from './types.js';
import { handleRpcRequest } from './mcp-handler.js';
import { createMcpServer } from './mcp-server.js';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Streamable HTTP endpoint (MCP SDK)
app.all('/mcp', async (c) => {
  const server = createMcpServer(c.env);
  const handler = createMcpHandler(server);
  return handler(c.req.raw, c.env, c.executionCtx);
});

app.post('/', async (c) => {
  const contentType = c.req.header('content-type');
  if (!contentType?.includes('application/json')) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Content-Type must be application/json' },
      },
      415
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    });
  }

  if (Array.isArray(body)) {
    const results = await Promise.all(
      body.map((req) => handleRpcRequest(c.env, req))
    );
    return c.json(results);
  }

  const result = await handleRpcRequest(c.env, body as Record<string, unknown>);
  return c.json(result);
});

app.all('/', (c) =>
  c.json({
    name: 'taiwan-hospital',
    version: '1.0.0',
    protocol: 'MCP',
    description: '台灣健保特約醫療機構查詢 MCP Server — 醫院、診所、藥局',
  })
);

export default app;
