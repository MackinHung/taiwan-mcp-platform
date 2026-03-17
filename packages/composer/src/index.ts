import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleComposerRpc } from './mcp-handler.js';
import type { ServerMapping } from './router.js';

interface Env {
  // Future: D1, KV bindings
}

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

// In production, mappings come from D1 via composition_servers table.
// For now, this is a placeholder endpoint.
app.post('/compose/:slug', async (c) => {
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

  // TODO: Load mappings from D1 by composition slug
  const mappings: ServerMapping[] = [];

  if (Array.isArray(body)) {
    const results = await Promise.all(
      body.map((req) => handleComposerRpc(mappings, req))
    );
    return c.json(results);
  }

  const result = await handleComposerRpc(
    mappings,
    body as Record<string, unknown>
  );
  return c.json(result);
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'mcp-composer' }));

export default app;

// Re-exports
export { handleComposerRpc } from './mcp-handler.js';
export { parseNamespacedTool, buildNamespacedName, findServerForTool, aggregateTools } from './router.js';
export type { ServerMapping, ToolDefinition } from './router.js';
export { selectMode, getMetaTools } from './lazy-loader.js';
export { SessionStore, createSession, getSession, deleteSession } from './session.js';
export { proxyToolCall } from './proxy.js';
