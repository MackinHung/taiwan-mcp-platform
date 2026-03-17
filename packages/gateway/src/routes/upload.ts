import { Hono } from 'hono';
import type { Env } from '../env.js';
import { serverCreateSchema, serverUpdateSchema } from '@shared/validation.js';
import { z } from 'zod';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const uploadRoutes = new Hono<HonoEnv>();

const ROLE_HIERARCHY: Record<string, number> = { user: 0, developer: 1, admin: 2 };

function requireDeveloper(c: any): any {
  const user = c.get('user');
  if (!user) return null;
  if ((ROLE_HIERARCHY[user.role] ?? 0) < ROLE_HIERARCHY.developer) return 'forbidden';
  return user;
}

// POST / -> create new server
uploadRoutes.post('/', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const body = await c.req.json();
  const parsed = serverCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null, details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  // Check slug uniqueness
  const existing = await c.env.DB.prepare(
    'SELECT id FROM servers WHERE slug = ?'
  ).bind(data.slug).first();

  if (existing) {
    return c.json({ success: false, error: '此 slug 已被使用', data: null }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO servers (
      id, owner_id, slug, name, description, version, category, tags, license,
      repo_url, endpoint_url, readme,
      declared_data_sensitivity, declared_permissions, declared_external_urls,
      is_open_source, data_source_license,
      badge_source, badge_data, badge_permission, badge_community,
      review_status, declaration_match,
      total_calls, total_stars, monthly_calls,
      is_published, is_official,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      'undeclared', 'public', 'readonly', 'new',
      'pending_scan', 'pending',
      0, 0, 0,
      0, 0,
      ?, ?
    )`
  ).bind(
    id, user.id, data.slug, data.name, data.description, data.version, data.category,
    JSON.stringify(data.tags), data.license || null,
    data.repo_url || null, data.endpoint_url || null, data.readme || null,
    data.declared_data_sensitivity, data.declared_permissions, JSON.stringify(data.declared_external_urls),
    data.is_open_source ? 1 : 0, data.data_source_license || null,
    now, now,
  ).run();

  return c.json({ success: true, data: { id, slug: data.slug }, error: null }, 201);
});

// PUT /:slug -> update server metadata
uploadRoutes.put('/:slug', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    'SELECT id, owner_id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string; owner_id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  if (server.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: '權限不足', data: null }, 403);
  }

  const body = await c.req.json();
  const parsed = serverUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const updates = parsed.data;
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.version !== undefined) { fields.push('version = ?'); values.push(updates.version); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.license !== undefined) { fields.push('license = ?'); values.push(updates.license); }
  if (updates.repo_url !== undefined) { fields.push('repo_url = ?'); values.push(updates.repo_url); }
  if (updates.endpoint_url !== undefined) { fields.push('endpoint_url = ?'); values.push(updates.endpoint_url); }
  if (updates.readme !== undefined) { fields.push('readme = ?'); values.push(updates.readme); }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    await c.env.DB.prepare(
      `UPDATE servers SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values, server.id).run();
  }

  return c.json({ success: true, data: { id: server.id }, error: null });
});

// POST /:slug/versions -> create new version
const versionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/, 'Must be valid semver'),
  changelog: z.string().max(5000).optional(),
});

uploadRoutes.post('/:slug/versions', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    'SELECT id, owner_id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string; owner_id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  if (server.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: '權限不足', data: null }, 403);
  }

  const body = await c.req.json();
  const parsed = versionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const { version, changelog } = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO server_versions (id, server_id, version, changelog, review_status, created_at)
     VALUES (?, ?, ?, ?, 'pending_scan', ?)`
  ).bind(id, server.id, version, changelog || null, now).run();

  // Update server version
  await c.env.DB.prepare(
    'UPDATE servers SET version = ?, updated_at = ? WHERE id = ?'
  ).bind(version, now, server.id).run();

  return c.json({ success: true, data: { id, version }, error: null }, 201);
});
