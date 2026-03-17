import { Hono } from 'hono';
import type { Env } from '../env.js';
import { reviewActionSchema } from '@shared/validation.js';

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
    `SELECT * FROM servers WHERE review_status NOT IN ('approved', 'rejected')
     ORDER BY created_at ASC`
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
