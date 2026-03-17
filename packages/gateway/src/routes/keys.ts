import { Hono } from 'hono';
import type { Env } from '../env.js';
import { apiKeyCreateSchema } from '@shared/validation.js';
import { nanoid } from '../lib/nanoid.js';
import { hashApiKey } from '../middleware/auth.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const keyRoutes = new Hono<HonoEnv>();

// GET / -> list user's API keys
keyRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const { results } = await c.env.DB.prepare(
    'SELECT id, user_id, name, key_prefix, permissions, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({ success: true, data: results, error: null });
});

// POST / -> create new API key
keyRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const body = await c.req.json();
  const parsed = apiKeyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null, details: parsed.error.flatten() }, 400);
  }

  const { name, permissions, expires_at } = parsed.data;

  // Generate key: sk-{random}
  const rawKey = `sk-${nanoid(32)}`;
  const keyHash = await hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 7) + '...';

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, permissions, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, name, keyHash, keyPrefix, JSON.stringify(permissions), expires_at || null, now).run();

  // Cache in KV — TTL must respect expires_at to avoid stale cache
  const cacheTtl = expires_at
    ? Math.max(60, Math.floor((new Date(expires_at).getTime() - Date.now()) / 1000))
    : 86400;
  await c.env.API_KEY_CACHE.put(`key:${keyHash}`, JSON.stringify({
    user_id: user.id,
    permissions,
    expires_at: expires_at || null,
  }), { expirationTtl: cacheTtl });

  return c.json({
    success: true,
    data: { id, key: rawKey, key_prefix: keyPrefix, name, permissions },
    error: null,
  }, 201);
});

// DELETE /:id -> delete API key
keyRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);

  const keyId = c.req.param('id');

  const key = await c.env.DB.prepare(
    'SELECT id, user_id, key_hash FROM api_keys WHERE id = ?'
  ).bind(keyId).first<{ id: string; user_id: string; key_hash: string }>();

  if (!key || key.user_id !== user.id) {
    return c.json({ success: false, error: 'API Key 不存在', data: null }, 404);
  }

  // Remove from KV cache
  await c.env.API_KEY_CACHE.delete(`key:${key.key_hash}`);

  // Remove from D1
  await c.env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(keyId).run();

  return c.json({ success: true, data: null, error: null });
});
