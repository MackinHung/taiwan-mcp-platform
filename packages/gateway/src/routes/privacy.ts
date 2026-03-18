import { Hono } from 'hono';
import type { Env } from '../env.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const privacyRoutes = new Hono<HonoEnv>();

/**
 * GET /api/privacy/my-data
 * Returns all stored data for the authenticated user.
 */
privacyRoutes.get('/my-data', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  // Fetch user profile
  const profile = await c.env.DB.prepare(
    'SELECT id, username, display_name, email, avatar_url, role, plan, scenario, created_at, updated_at FROM users WHERE id = ?'
  ).bind(user.id).first();

  // Fetch API keys (no hash exposed)
  const { results: apiKeys } = await c.env.DB.prepare(
    'SELECT id, name, key_prefix, permissions, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  // Fetch sessions (non-expired)
  const { results: sessions } = await c.env.DB.prepare(
    'SELECT id, created_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(user.id).all();

  // Fetch usage data (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const { results: usage } = await c.env.DB.prepare(
    'SELECT date, server_id, call_count, error_count FROM usage_daily WHERE user_id = ? AND date >= ? ORDER BY date DESC'
  ).bind(user.id, ninetyDaysAgo).all();

  // Fetch stars
  const { results: stars } = await c.env.DB.prepare(
    'SELECT server_id, created_at FROM stars WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  // Fetch compositions
  const { results: compositions } = await c.env.DB.prepare(
    'SELECT id, name, description, endpoint_slug, is_active, created_at FROM compositions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  // Fetch reports filed by user
  const { results: reports } = await c.env.DB.prepare(
    'SELECT id, server_id, type, description, status, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({
    success: true,
    data: {
      profile,
      api_keys: apiKeys,
      sessions,
      usage_history: usage,
      stars,
      compositions,
      reports,
      data_retention: {
        profile: '保留至用戶刪除帳號',
        api_keys: '保留至用戶刪除或到期',
        usage_history: '保留 90 天',
        sessions: '保留至到期（最長 24 小時）',
      },
    },
    error: null,
  });
});

/**
 * DELETE /api/privacy/my-data
 * Deletes all user data and the account itself.
 * This is irreversible.
 */
privacyRoutes.delete('/my-data', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const db = c.env.DB;

  // Delete in dependency order
  await db.prepare('DELETE FROM stars WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM reports WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM usage_daily WHERE user_id = ?').bind(user.id).run();

  // Delete API keys + clear KV cache
  const { results: keys } = await db.prepare(
    'SELECT key_hash FROM api_keys WHERE user_id = ?'
  ).bind(user.id).all<{ key_hash: string }>();
  for (const key of keys) {
    await c.env.API_KEY_CACHE.delete(`key:${key.key_hash}`);
  }
  await db.prepare('DELETE FROM api_keys WHERE user_id = ?').bind(user.id).run();

  // Delete compositions (and composition_servers via ON DELETE CASCADE if defined)
  const { results: comps } = await db.prepare(
    'SELECT id FROM compositions WHERE user_id = ?'
  ).bind(user.id).all<{ id: string }>();
  for (const comp of comps) {
    await db.prepare('DELETE FROM composition_servers WHERE composition_id = ?').bind(comp.id).run();
  }
  await db.prepare('DELETE FROM compositions WHERE user_id = ?').bind(user.id).run();

  // Delete sessions + clear KV cache
  const { results: sessions } = await db.prepare(
    'SELECT id FROM sessions WHERE user_id = ?'
  ).bind(user.id).all<{ id: string }>();
  for (const session of sessions) {
    await c.env.SESSION_CACHE.delete(`session:${session.id}`);
  }
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();

  // Finally delete the user
  await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

  return c.json({
    success: true,
    data: { message: '帳號及所有相關資料已刪除' },
    error: null,
  });
});

/**
 * POST /api/privacy/requests
 * Submit a data query/correction/deletion request.
 */
privacyRoutes.post('/requests', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const body = await c.req.json();
  const { type, description } = body;

  const validTypes = ['query', 'correction', 'deletion', 'stop_processing'];
  if (!type || !validTypes.includes(type)) {
    return c.json({
      success: false,
      error: `請求類型必須是 ${validTypes.join(', ')} 之一`,
      data: null,
    }, 400);
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return c.json({
      success: false,
      error: '請提供至少 10 個字元的說明',
      data: null,
    }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO privacy_requests (id, user_id, type, description, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`
  ).bind(id, user.id, type, description.trim(), now).run();

  return c.json({
    success: true,
    data: { id, type, status: 'pending', created_at: now },
    error: null,
  }, 201);
});

/**
 * GET /api/privacy/requests
 * List user's privacy requests.
 */
privacyRoutes.get('/requests', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT id, type, description, status, created_at, resolved_at FROM privacy_requests WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({ success: true, data: results, error: null });
});
