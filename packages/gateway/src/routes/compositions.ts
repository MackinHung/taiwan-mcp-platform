import { Hono } from 'hono';
import type { Env } from '../env.js';
import { compositionCreateSchema, compositionUpdateSchema, addServerToCompositionSchema } from '@shared/validation.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const compositionRoutes = new Hono<HonoEnv>();

function requireUser(c: any): any {
  const user = c.get('user');
  if (!user) {
    return null;
  }
  return user;
}

// GET / -> list user's compositions
compositionRoutes.get('/', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM compositions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({ success: true, data: results, error: null });
});

// POST / -> create composition
compositionRoutes.post('/', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const body = await c.req.json();
  const parsed = compositionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null, details: parsed.error.flatten() }, 400);
  }

  const { name, endpoint_slug, description, scenario } = parsed.data;

  // Check slug uniqueness
  const existing = await c.env.DB.prepare(
    'SELECT id FROM compositions WHERE endpoint_slug = ?'
  ).bind(endpoint_slug).first();

  if (existing) {
    return c.json({ success: false, error: '此端點 slug 已被使用', data: null }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO compositions (id, user_id, name, description, scenario, endpoint_slug, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).bind(id, user.id, name, description || null, scenario || null, endpoint_slug, now, now).run();

  return c.json({ success: true, data: { id, endpoint_slug }, error: null }, 201);
});

// GET /:id -> composition detail with servers
compositionRoutes.get('/:id', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const id = c.req.param('id');

  const composition = await c.env.DB.prepare(
    'SELECT * FROM compositions WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();

  if (!composition) {
    return c.json({ success: false, error: '組合不存在', data: null }, 404);
  }

  const { results: servers } = await c.env.DB.prepare(
    `SELECT cs.*, s.name as server_name, s.slug as server_slug
     FROM composition_servers cs
     JOIN servers s ON cs.server_id = s.id
     WHERE cs.composition_id = ?`
  ).bind(id).all();

  return c.json({ success: true, data: { ...composition, servers }, error: null });
});

// PUT /:id -> update composition
compositionRoutes.put('/:id', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const id = c.req.param('id');

  const composition = await c.env.DB.prepare(
    'SELECT id FROM compositions WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();

  if (!composition) {
    return c.json({ success: false, error: '組合不存在', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = compositionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const updates = parsed.data;
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.scenario !== undefined) { fields.push('scenario = ?'); values.push(updates.scenario); }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    await c.env.DB.prepare(
      `UPDATE compositions SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values, id).run();
  }

  return c.json({ success: true, data: { id }, error: null });
});

// DELETE /:id -> delete composition
compositionRoutes.delete('/:id', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const id = c.req.param('id');

  const composition = await c.env.DB.prepare(
    'SELECT id FROM compositions WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();

  if (!composition) {
    return c.json({ success: false, error: '組合不存在', data: null }, 404);
  }

  // Delete composition servers first
  await c.env.DB.prepare('DELETE FROM composition_servers WHERE composition_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM compositions WHERE id = ?').bind(id).run();

  return c.json({ success: true, data: null, error: null });
});

// POST /:id/servers -> add server to composition
compositionRoutes.post('/:id/servers', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const compositionId = c.req.param('id');

  const composition = await c.env.DB.prepare(
    'SELECT id FROM compositions WHERE id = ? AND user_id = ?'
  ).bind(compositionId, user.id).first();

  if (!composition) {
    return c.json({ success: false, error: '組合不存在', data: null }, 404);
  }

  const body = await c.req.json();
  const parsed = addServerToCompositionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const { server_id, namespace_prefix } = parsed.data;

  // Check namespace prefix conflict
  const conflict = await c.env.DB.prepare(
    'SELECT id FROM composition_servers WHERE composition_id = ? AND namespace_prefix = ?'
  ).bind(compositionId, namespace_prefix).first();

  if (conflict) {
    return c.json({ success: false, error: '此命名空間前綴已被使用', data: null }, 409);
  }

  // Verify server exists
  const server = await c.env.DB.prepare(
    'SELECT id FROM servers WHERE id = ?'
  ).bind(server_id).first();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO composition_servers (id, composition_id, server_id, namespace_prefix, enabled, added_at) VALUES (?, ?, ?, ?, 1, ?)'
  ).bind(id, compositionId, server_id, namespace_prefix, now).run();

  return c.json({ success: true, data: { id }, error: null }, 201);
});

// DELETE /:id/servers/:serverId -> remove server from composition
compositionRoutes.delete('/:id/servers/:serverId', async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const compositionId = c.req.param('id');
  const serverId = c.req.param('serverId');

  const composition = await c.env.DB.prepare(
    'SELECT id FROM compositions WHERE id = ? AND user_id = ?'
  ).bind(compositionId, user.id).first();

  if (!composition) {
    return c.json({ success: false, error: '組合不存在', data: null }, 404);
  }

  await c.env.DB.prepare(
    'DELETE FROM composition_servers WHERE id = ? AND composition_id = ?'
  ).bind(serverId, compositionId).run();

  return c.json({ success: true, data: null, error: null });
});
