import { Hono } from 'hono';
import type { Env } from '../env.js';
import { serverQuerySchema, reportCreateSchema } from '@shared/validation.js';
import { defer } from '../lib/defer.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const serverRoutes = new Hono<HonoEnv>();

const SORT_COLUMNS: Record<string, string> = {
  popular: 's.total_calls DESC',
  stars: 's.total_stars DESC',
  newest: 's.created_at DESC',
  name: 's.name ASC',
};

// GET /stats -> aggregate stats for published servers (cached 60s)
serverRoutes.get('/stats', async (c) => {
  const env = c.env;

  // KV cache for stats
  const cacheKey = 'cache:servers:stats';
  const cached = await env.SERVER_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  const row = await env.DB.prepare(
    `SELECT
       COUNT(*) as total_published,
       COALESCE(SUM((SELECT COUNT(*) FROM tools t WHERE t.server_id = s.id)), 0) as total_tools,
       COALESCE(SUM(s.total_calls), 0) as total_calls
     FROM servers s
     WHERE s.is_published = 1 AND s.review_status = 'approved'`
  ).first<{ total_published: number; total_tools: number; total_calls: number }>();

  const response = {
    success: true,
    data: {
      total_published: row?.total_published ?? 0,
      total_tools: row?.total_tools ?? 0,
      total_calls: row?.total_calls ?? 0,
    },
    error: null,
  };

  // Cache for 60 seconds (non-blocking)
  const putPromise = env.SERVER_CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 60 });
  defer(c, putPromise);

  return c.json(response);
});

// GET / -> list published servers
serverRoutes.get('/', async (c) => {
  const env = c.env;
  const raw = {
    category: c.req.query('category'),
    badge_data: c.req.query('badge_data'),
    badge_source: c.req.query('badge_source'),
    search: c.req.query('search'),
    sort: c.req.query('sort'),
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  };

  const parsed = serverQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const { category, badge_data, badge_source, search, sort, page, limit } = parsed.data;

  let whereClause = 'WHERE s.is_published = 1 AND s.review_status = ?';
  const countParams: any[] = ['approved'];
  const queryParams: any[] = ['approved'];

  if (category) {
    whereClause += ' AND s.category = ?';
    countParams.push(category);
    queryParams.push(category);
  }

  if (badge_data) {
    whereClause += ' AND s.badge_data = ?';
    countParams.push(badge_data);
    queryParams.push(badge_data);
  }

  if (badge_source) {
    whereClause += ' AND s.badge_source = ?';
    countParams.push(badge_source);
    queryParams.push(badge_source);
  }

  if (search) {
    whereClause += ' AND (s.name LIKE ? OR s.description LIKE ?)';
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern);
    queryParams.push(searchPattern, searchPattern);
  }

  const offset = (page - 1) * limit;
  const orderBy = SORT_COLUMNS[sort || 'popular'] || SORT_COLUMNS.popular;

  // KV cache for server listings (60s TTL)
  const cacheKey = `cache:servers:${category || 'all'}:${badge_data || ''}:${badge_source || ''}:${search || ''}:${sort}:${page}:${limit}`;
  const cached = await env.SERVER_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  // D1 batch — run COUNT + SELECT in single round-trip
  const [countResult, dataResult] = await env.DB.batch([
    env.DB.prepare(
      `SELECT COUNT(*) as total FROM servers s ${whereClause}`
    ).bind(...countParams),
    env.DB.prepare(
      `SELECT s.*,
         u.username as owner_username,
         u.display_name as owner_display_name,
         (SELECT COUNT(*) FROM tools t WHERE t.server_id = s.id) as tools_count
       FROM servers s
       LEFT JOIN users u ON s.owner_id = u.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    ).bind(...queryParams, limit, offset),
  ]);

  const total = (countResult.results[0] as any)?.total ?? 0;
  const results = dataResult.results;

  const response = {
    success: true,
    data: results,
    error: null,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };

  // Cache for 60 seconds (non-blocking)
  const putPromise = env.SERVER_CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 60 });
  defer(c, putPromise);

  return c.json(response);
});

// GET /:slug -> server detail
serverRoutes.get('/:slug', async (c) => {
  const env = c.env;
  const slug = c.req.param('slug');

  // Avoid matching "star" and "report" as slug
  if (slug === 'star' || slug === 'report') return c.notFound();

  const server = await env.DB.prepare(
    `SELECT s.*,
       u.username as owner_username,
       u.display_name as owner_display_name,
       (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'trust') as trust_votes,
       (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'distrust') as distrust_votes,
       (SELECT COUNT(*) FROM reports WHERE server_id = s.id AND type = 'security' AND status IN ('open','investigating')) as open_reports
     FROM servers s
     LEFT JOIN users u ON s.owner_id = u.id
     WHERE s.slug = ?`
  ).bind(slug).first();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const { results: tools } = await env.DB.prepare(
    'SELECT * FROM tools WHERE server_id = ?'
  ).bind((server as any).id).all();

  return c.json({
    success: true,
    data: { ...server, tools },
    error: null,
  });
});

// GET /:slug/tools -> tool list
serverRoutes.get('/:slug/tools', async (c) => {
  const env = c.env;
  const slug = c.req.param('slug');

  const server = await env.DB.prepare(
    'SELECT id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const { results } = await env.DB.prepare(
    'SELECT * FROM tools WHERE server_id = ?'
  ).bind(server.id).all();

  return c.json({ success: true, data: results, error: null });
});

// POST /:slug/star -> add star
serverRoutes.post('/:slug/star', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const env = c.env;
  const slug = c.req.param('slug');

  const server = await env.DB.prepare(
    'SELECT id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  // Check if already starred
  const existing = await env.DB.prepare(
    'SELECT user_id FROM stars WHERE user_id = ? AND server_id = ?'
  ).bind(user.id, server.id).first();

  if (!existing) {
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO stars (user_id, server_id, created_at) VALUES (?, ?, ?)'
    ).bind(user.id, server.id, now).run();

    await env.DB.prepare(
      'UPDATE servers SET total_stars = total_stars + 1 WHERE id = ?'
    ).bind(server.id).run();
  }

  return c.json({ success: true, data: null, error: null });
});

// DELETE /:slug/star -> remove star
serverRoutes.delete('/:slug/star', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const env = c.env;
  const slug = c.req.param('slug');

  const server = await env.DB.prepare(
    'SELECT id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  await env.DB.prepare(
    'DELETE FROM stars WHERE user_id = ? AND server_id = ?'
  ).bind(user.id, server.id).run();

  await env.DB.prepare(
    'UPDATE servers SET total_stars = MAX(0, total_stars - 1) WHERE id = ?'
  ).bind(server.id).run();

  return c.json({ success: true, data: null, error: null });
});

// POST /:slug/report -> create report
serverRoutes.post('/:slug/report', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const env = c.env;
  const slug = c.req.param('slug');

  const server = await env.DB.prepare(
    'SELECT id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = reportCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null, details: parsed.error.flatten() }, 400);
  }

  const { type, description } = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO reports (id, user_id, server_id, type, description, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`
  ).bind(id, user.id, server.id, type, description, now).run();

  return c.json({ success: true, data: { id }, error: null }, 201);
});
