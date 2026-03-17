import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types.js';
import { handleRpcRequest } from './mcp-handler.js';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.post('/', async (c) => {
  const contentType = c.req.header('content-type');
  if (!contentType?.includes('application/json')) {
    return c.json({ error: 'Content-Type must be application/json' }, 415);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      },
      400
    );
  }

  // Handle batch requests
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
  c.json({ name: 'taiwan-transit-mcp', version: '1.0.0', protocol: 'MCP' })
);

export default app;
