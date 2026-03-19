import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../env.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const openclawConfigRoutes = new Hono<HonoEnv>();

/** Validate that client query param is 'openclaw', return 400 if not. */
function validateClientParam(c: Context<HonoEnv>): boolean {
  const client = c.req.query('client');
  return client === 'openclaw';
}

/** Build a single server entry for the OpenClaw mcpServers config. */
function buildServerEntry(slug: string, endpointUrl: string | null) {
  return {
    [slug]: {
      url: endpointUrl,
      headers: {
        Authorization: 'Bearer <YOUR_API_KEY>',
      },
    },
  };
}

// GET /my/config?client=openclaw -> batch export (auth required)
// Must be registered BEFORE /:slug/config to avoid catch-all conflict
openclawConfigRoutes.get('/my/config', async (c) => {
  if (!validateClientParam(c)) {
    return c.json({ success: false, error: 'client must be openclaw', data: null }, 400);
  }

  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT s.slug, s.name, s.endpoint_url
     FROM composition_servers cs
     JOIN compositions comp ON cs.composition_id = comp.id
     JOIN servers s ON cs.server_id = s.id
     WHERE comp.user_id = ? AND cs.enabled = 1`
  ).bind(user.id).all();

  const mcpServers = Object.fromEntries(
    (results as { slug: string; endpoint_url: string | null }[]).map((row) => [
      row.slug,
      { url: row.endpoint_url, headers: { Authorization: 'Bearer <YOUR_API_KEY>' } },
    ])
  );

  return c.json({ success: true, data: { mcpServers }, error: null });
});

// GET /:slug/config?client=openclaw -> single server config (public)
openclawConfigRoutes.get('/:slug/config', async (c) => {
  if (!validateClientParam(c)) {
    return c.json({ success: false, error: 'client must be openclaw', data: null }, 400);
  }

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    'SELECT slug, name, endpoint_url FROM servers WHERE slug = ?'
  ).bind(slug).first<{ slug: string; name: string; endpoint_url: string | null }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const mcpServers = buildServerEntry(server.slug, server.endpoint_url);

  return c.json({ success: true, data: { mcpServers }, error: null });
});
