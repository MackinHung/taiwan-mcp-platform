import { Hono } from 'hono';
import type { Env } from '../env.js';
import { reviewActionSchema, expediteSchema, extendSchema, officialToggleSchema } from '@shared/validation.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const adminRoutes = new Hono<HonoEnv>();

function requireAdmin(c: any): any {
  const user = c.get('user');
  if (!user) return null;
  if (user.role !== 'admin') return 'forbidden';
  return user;
}

// GET /review-queue -> list pending reviews
adminRoutes.get('/review-queue', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const { results } = await c.env.DB.prepare(
    `SELECT s.*,
       (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'trust') as trust_votes,
       (SELECT COUNT(*) FROM community_votes WHERE server_id = s.id AND vote = 'distrust') as distrust_votes,
       (SELECT COUNT(*) FROM reports WHERE server_id = s.id AND type = 'security' AND status IN ('open','investigating')) as open_reports
     FROM servers s
     WHERE s.review_status NOT IN ('approved', 'rejected')
     ORDER BY s.created_at ASC`
  ).all();

  return c.json({ success: true, data: results, error: null });
});

// POST /review/:serverId -> approve or reject
adminRoutes.post('/review/:serverId', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const admin = result;

  const serverId = c.req.param('serverId');

  const server = await c.env.DB.prepare(
    'SELECT id FROM servers WHERE id = ?'
  ).bind(serverId).first();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const { status, notes } = parsed.data;
  const now = new Date().toISOString();

  const isPublished = status === 'approved' ? 1 : 0;

  await c.env.DB.prepare(
    `UPDATE servers SET
      review_status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = ?,
      is_published = ?, published_at = CASE WHEN ? = 1 THEN ? ELSE published_at END,
      updated_at = ?
     WHERE id = ?`
  ).bind(status, notes || null, admin.id, now, isPublished, isPublished, now, now, serverId).run();

  return c.json({ success: true, data: { id: serverId, status }, error: null });
});

// GET /stats -> platform statistics
adminRoutes.get('/stats', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const serverCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM servers').first<{ count: number }>();
  const totalCalls = await c.env.DB.prepare('SELECT COALESCE(SUM(call_count), 0) as total FROM usage_daily').first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      users: userCount?.count ?? 0,
      servers: serverCount?.count ?? 0,
      total_calls: totalCalls?.total ?? 0,
    },
    error: null,
  });
});

// GET /users -> user list
adminRoutes.get('/users', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const { results } = await c.env.DB.prepare(
    'SELECT id, github_id, username, display_name, email, avatar_url, role, plan, created_at, updated_at FROM users ORDER BY created_at DESC'
  ).all();

  return c.json({ success: true, data: results, error: null });
});

// PUT /users/:id -> update user role/plan
adminRoutes.put('/users/:id', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const userId = c.req.param('id');

  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ success: false, error: '使用者不存在', data: null }, 404);
  }

  const body = await c.req.json();
  const fields: string[] = [];
  const values: any[] = [];

  if (body.role) {
    if (!['user', 'developer', 'admin'].includes(body.role)) {
      return c.json({ success: false, error: '無效的角色', data: null }, 400);
    }
    fields.push('role = ?');
    values.push(body.role);
  }

  if (body.plan) {
    if (!['free', 'developer', 'team', 'enterprise'].includes(body.plan)) {
      return c.json({ success: false, error: '無效的方案', data: null }, 400);
    }
    fields.push('plan = ?');
    values.push(body.plan);
  }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    await c.env.DB.prepare(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values, userId).run();
  }

  return c.json({ success: true, data: { id: userId }, error: null });
});

// GET /scan-reports/:serverId/:version -> scan report for a specific version
adminRoutes.get('/scan-reports/:serverId/:version', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const serverId = c.req.param('serverId');
  const version = c.req.param('version');

  const report = await c.env.DB.prepare(
    `SELECT * FROM review_reports
     WHERE server_id = ? AND version = ?
     ORDER BY created_at DESC
     LIMIT 1`
  ).bind(serverId, version).first();

  return c.json({ success: true, data: report || null, error: null });
});

// GET /reports -> list all reports with server/user info
adminRoutes.get('/reports', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const statusFilter = c.req.query('status');
  const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];

  const hasFilter = statusFilter && validStatuses.includes(statusFilter);

  const query = hasFilter
    ? `SELECT r.*, s.name as server_name, s.slug as server_slug,
         u.username as reporter_username, u.display_name as reporter_display_name
       FROM reports r
       LEFT JOIN servers s ON r.server_id = s.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.status = ?
       ORDER BY r.created_at DESC`
    : `SELECT r.*, s.name as server_name, s.slug as server_slug,
         u.username as reporter_username, u.display_name as reporter_display_name
       FROM reports r
       LEFT JOIN servers s ON r.server_id = s.id
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`;

  const { results } = hasFilter
    ? await c.env.DB.prepare(query).bind(statusFilter).all()
    : await c.env.DB.prepare(query).all();

  return c.json({ success: true, data: results, error: null });
});

// PUT /reports/:id -> update report status
adminRoutes.put('/reports/:id', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const reportId = c.req.param('id');

  const report = await c.env.DB.prepare(
    'SELECT id FROM reports WHERE id = ?'
  ).bind(reportId).first();

  if (!report) {
    return c.json({ success: false, error: '回報不存在', data: null }, 404);
  }

  const body = await c.req.json();
  if (!body.status || !['open', 'investigating', 'resolved', 'dismissed'].includes(body.status)) {
    return c.json({ success: false, error: '無效的狀態', data: null }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE reports SET status = ? WHERE id = ?'
  ).bind(body.status, reportId).run();

  return c.json({ success: true, data: { id: reportId, status: body.status }, error: null });
});

// GET /anomaly-logs -> anomaly detection logs from KV
adminRoutes.get('/anomaly-logs', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const dateParam = c.req.query('date');
  const dateStr = dateParam || new Date().toISOString().slice(0, 10);
  const key = `anomaly:${dateStr}`;
  const raw = await c.env.RATE_LIMITS.get(key);
  const events = raw ? JSON.parse(raw) : [];

  return c.json({ success: true, data: { date: dateStr, events }, error: null });
});

// POST /recalculate-badges -> recalculate community badges for all published servers
adminRoutes.post('/recalculate-badges', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const { results: servers } = await c.env.DB.prepare(
    'SELECT id, total_calls, total_stars, badge_community FROM servers WHERE is_published = 1'
  ).all<{ id: string; total_calls: number; total_stars: number; badge_community: string }>();

  let totalUpdated = 0;

  for (const server of servers) {
    const calls = server.total_calls || 0;
    const stars = server.total_stars || 0;
    let newBadge: string;

    if (calls >= 10000 && stars >= 50) {
      newBadge = 'trusted';
    } else if (calls >= 1000) {
      newBadge = 'popular';
    } else if (calls >= 100) {
      newBadge = 'rising';
    } else {
      newBadge = 'new';
    }

    if (newBadge !== server.badge_community) {
      await c.env.DB.prepare(
        'UPDATE servers SET badge_community = ?, updated_at = ? WHERE id = ?'
      ).bind(newBadge, new Date().toISOString(), server.id).run();
      totalUpdated++;
    }
  }

  return c.json({
    success: true,
    data: { total_checked: servers.length, total_updated: totalUpdated },
    error: null,
  });
});

// POST /rescan -> re-scan all published servers' dependencies via OSV
adminRoutes.post('/rescan', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const { results: servers } = await c.env.DB.prepare(
    `SELECT id, version, badge_external
     FROM servers WHERE is_published = 1`
  ).all<{ id: string; version: string; badge_external: string }>();

  const targets = servers.map(s => ({
    serverId: s.id,
    version: s.version,
    dependencies: {} as Record<string, string>,
    currentBadgeExternal: s.badge_external || 'unverified',
  }));

  const { rescanAll } = await import('@review/rescan.js');
  const summary = await rescanAll(targets);

  for (const r of summary.results) {
    if (r.badgeChanged) {
      await c.env.DB.prepare(
        'UPDATE servers SET badge_external = ?, updated_at = ? WHERE id = ?'
      ).bind(r.newBadge, new Date().toISOString(), r.serverId).run();
    }
  }

  return c.json({ success: true, data: summary, error: null });
});

// POST /disclosure/:serverId/expedite -> immediately publish (bypass remaining disclosure)
adminRoutes.post('/disclosure/:serverId/expedite', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const serverId = c.req.param('serverId');

  const server = await c.env.DB.prepare(
    `SELECT id, version FROM servers WHERE id = ? AND review_status = 'scan_passed' AND disclosed_at IS NOT NULL AND is_published = 0`
  ).bind(serverId).first<{ id: string; version: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在或不在公示期中', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = expediteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '請輸入快速上架原因', data: null }, 400);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE servers SET review_status='approved', is_published=1, published_at=?, review_notes=?, reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=?`
  ).bind(now, parsed.data.reason, result.id, now, now, serverId).run();

  await c.env.DB.prepare(
    `UPDATE server_versions SET review_status='approved' WHERE server_id=? AND version=?`
  ).bind(serverId, server.version).run();

  return c.json({ success: true, data: { id: serverId, status: 'approved' }, error: null });
});

// POST /disclosure/:serverId/extend -> extend disclosure period by N days
adminRoutes.post('/disclosure/:serverId/extend', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const serverId = c.req.param('serverId');

  const server = await c.env.DB.prepare(
    `SELECT id, disclosure_ends_at FROM servers WHERE id = ? AND review_status = 'scan_passed' AND disclosed_at IS NOT NULL AND is_published = 0`
  ).bind(serverId).first<{ id: string; disclosure_ends_at: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在或不在公示期中', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = extendSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '天數必須在 1-30 之間', data: null }, 400);
  }

  const currentEnd = new Date(server.disclosure_ends_at);
  const newEnd = new Date(currentEnd.getTime() + parsed.data.days * 86_400_000).toISOString();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE servers SET disclosure_ends_at=?, updated_at=? WHERE id=?`
  ).bind(newEnd, now, serverId).run();

  return c.json({ success: true, data: { id: serverId, disclosure_ends_at: newEnd }, error: null });
});

// PATCH /servers/:id/official -> toggle is_official flag
adminRoutes.patch('/servers/:id/official', async (c) => {
  const result = requireAdmin(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);

  const serverId = c.req.param('id');

  const server = await c.env.DB.prepare(
    'SELECT id, is_official FROM servers WHERE id = ?'
  ).bind(serverId).first<{ id: string; is_official: number }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = officialToggleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'is_official 必須為布林值', data: null }, 400);
  }

  const newValue = parsed.data.is_official ? 1 : 0;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE servers SET is_official = ?, updated_at = ? WHERE id = ?'
  ).bind(newValue, now, serverId).run();

  return c.json({ success: true, data: { id: serverId, is_official: parsed.data.is_official }, error: null });
});
