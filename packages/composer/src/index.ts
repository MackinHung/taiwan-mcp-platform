import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, CompositionConfig, McpRequest } from './types.js';
import { handleMcpRequest } from './mcp-handler.js';

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

// Load composition config from DB/KV
async function loadComposition(env: Env, slug: string): Promise<CompositionConfig | null> {
  // Try KV cache first
  const cached = await env.TOOL_REGISTRY.get(`comp:${slug}`);
  if (cached) return JSON.parse(cached);

  // Fallback to D1
  const comp = await env.DB.prepare(
    `SELECT c.*, cs.server_id, cs.namespace_prefix, cs.enabled, cs.pinned_version,
            s.slug as server_slug, s.name as server_name, s.endpoint_url,
            s.declared_permissions, s.declared_external_urls
     FROM compositions c
     JOIN composition_servers cs ON cs.composition_id = c.id
     JOIN servers s ON s.id = cs.server_id
     WHERE c.endpoint_slug = ?`
  ).bind(slug).all();

  if (!comp.results || comp.results.length === 0) return null;

  const first = comp.results[0] as any;
  const config: CompositionConfig = {
    id: first.id,
    user_id: first.user_id,
    name: first.name,
    endpoint_slug: first.endpoint_slug,
    is_active: !!first.is_active,
    servers: comp.results.map((r: any) => ({
      server_id: r.server_id,
      server_slug: r.server_slug,
      server_name: r.server_name,
      namespace_prefix: r.namespace_prefix,
      endpoint_url: r.endpoint_url,
      enabled: !!r.enabled,
      pinned_version: r.pinned_version || null,
      declared_permissions: r.declared_permissions || undefined,
      declared_external_urls: r.declared_external_urls ? JSON.parse(r.declared_external_urls) : undefined,
    })),
  };

  // Cache for 5 minutes
  await env.TOOL_REGISTRY.put(`comp:${slug}`, JSON.stringify(config), { expirationTtl: 300 });

  return config;
}

// Composition MCP endpoint
app.post('/mcp/u/:slug', async (c) => {
  const slug = c.req.param('slug');
  const composition = await loadComposition(c.env, slug);

  if (!composition) {
    return c.json(
      { jsonrpc: '2.0', id: null, error: { code: -32600, message: '組合不存在' } },
      404
    );
  }

  if (!composition.is_active) {
    return c.json(
      { jsonrpc: '2.0', id: null, error: { code: -32600, message: '組合已停用' } },
      403
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      400
    );
  }

  if (Array.isArray(body)) {
    const results = await Promise.all(
      body.map(req => handleMcpRequest(composition, req))
    );
    return c.json(results);
  }

  const result = await handleMcpRequest(composition, body as McpRequest);
  return c.json(result);
});

// Single server MCP proxy endpoint
app.post('/mcp/s/:slug', async (c) => {
  const slug = c.req.param('slug');
  const server = await c.env.DB.prepare(
    'SELECT endpoint_url FROM servers WHERE slug = ? AND is_published = 1'
  ).bind(slug).first<{ endpoint_url: string }>();

  if (!server?.endpoint_url) {
    return c.json({ error: 'Server not found' }, 404);
  }

  const body = await c.req.text();
  const upstream = await fetch(server.endpoint_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Session termination
app.delete('/mcp/u/:slug', (c) => {
  return c.json({ status: 'session terminated' });
});

// Legacy compose endpoint for basic testing without D1
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
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      400
    );
  }

  // Use empty composition for legacy endpoint
  const emptyComposition: CompositionConfig = {
    id: 'legacy',
    user_id: 'legacy',
    name: 'legacy',
    endpoint_slug: c.req.param('slug'),
    is_active: true,
    servers: [],
  };

  if (Array.isArray(body)) {
    const results = await Promise.all(
      body.map((req) => handleMcpRequest(emptyComposition, req))
    );
    return c.json(results);
  }

  const result = await handleMcpRequest(emptyComposition, body as McpRequest);
  return c.json(result);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'mcp-composer' }));

export default app;

// Re-exports
export { handleMcpRequest } from './mcp-handler.js';
export { parseNamespacedTool, findServer, routeToolCall } from './router.js';
export { selectMode, loadAllTools, getMetaTools } from './lazy-loader.js';
export { SessionStore } from './session.js';
export { proxyToServer } from './proxy.js';
export type {
  Env,
  CompositionConfig,
  CompositionServerEntry,
  NamespacedTool,
  McpRequest,
  McpResponse,
  SessionState,
} from './types.js';
