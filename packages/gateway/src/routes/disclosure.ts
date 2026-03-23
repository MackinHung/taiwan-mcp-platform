import { Hono } from 'hono';
import type { Env } from '../env.js';
import { voteSchema } from '@shared/validation.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const disclosureRoutes = new Hono<HonoEnv>();

// GET / -> list servers in disclosure period (public, no auth required)
disclosureRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.id, s.slug, s.name, s.description, s.version, s.category, s.tags,
            s.badge_source, s.badge_data, s.badge_permission, s.badge_community, s.badge_external,
            s.disclosed_at, s.disclosure_ends_at, s.owner_id, s.created_at,
            (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'trust') as trust_votes,
            (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'distrust') as distrust_votes,
            (SELECT COUNT(*) FROM reports WHERE server_id = s.id AND type = 'security' AND status IN ('open','investigating')) as open_reports,
            u.username as owner_username, u.display_name as owner_display_name
     FROM servers s
     LEFT JOIN users u ON s.owner_id = u.id
     WHERE s.review_status = 'scan_passed'
       AND s.disclosed_at IS NOT NULL
       AND s.is_published = 0
     ORDER BY s.disclosed_at DESC`
  ).all();

  return c.json({ success: true, data: results, error: null });
});

// GET /:slug -> disclosure detail for a specific server
disclosureRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    `SELECT s.*,
            (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'trust') as trust_votes,
            (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'distrust') as distrust_votes,
            (SELECT COUNT(*) FROM reports WHERE server_id = s.id AND type = 'security' AND status IN ('open','investigating')) as open_reports,
            u.username as owner_username, u.display_name as owner_display_name
     FROM servers s
     LEFT JOIN users u ON s.owner_id = u.id
     WHERE s.slug = ?
       AND s.review_status = 'scan_passed'
       AND s.disclosed_at IS NOT NULL
       AND s.is_published = 0`
  ).bind(slug).first();

  if (!server) {
    return c.json({ success: false, error: 'Server not found or not in disclosure', data: null }, 404);
  }

  // Get latest scan report
  const report = await c.env.DB.prepare(
    `SELECT * FROM review_reports WHERE server_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind((server as any).id).first();

  return c.json({
    success: true,
    data: { server, scanReport: report || null },
    error: null,
  });
});

// POST /:slug/vote -> cast trust/distrust vote (requires login)
disclosureRoutes.post('/:slug/vote', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Please log in to vote', data: null }, 401);
  }

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    `SELECT id FROM servers
     WHERE slug = ?
       AND review_status = 'scan_passed'
       AND disclosed_at IS NOT NULL
       AND is_published = 0`
  ).bind(slug).first<{ id: string }>();

  if (!server) {
    return c.json({ success: false, error: 'Server not found or not in disclosure', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Invalid vote', data: null }, 400);
  }

  const voteId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Upsert: INSERT OR REPLACE handles UNIQUE(server_id, user_id)
  await c.env.DB.prepare(
    `INSERT INTO community_votes (id, server_id, user_id, vote, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(server_id, user_id)
     DO UPDATE SET vote = excluded.vote, created_at = excluded.created_at`
  ).bind(voteId, server.id, user.id, parsed.data.vote, now).run();

  return c.json({ success: true, data: { vote: parsed.data.vote }, error: null });
});
