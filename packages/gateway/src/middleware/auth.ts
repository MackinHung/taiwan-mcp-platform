import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';
import { parseCookies } from '../lib/cookie.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function resolveSessionFromKV(env: Env, token: string): Promise<{ user_id: string; expires_at: string } | null> {
  const cached = await env.SESSION_CACHE.get(`session:${token}`);
  if (cached) {
    const session = JSON.parse(cached);
    if (new Date(session.expires_at) > new Date()) {
      return session;
    }
    return null;
  }
  return null;
}

async function resolveSessionFromD1(env: Env, token: string): Promise<{ user_id: string; expires_at: string } | null> {
  const session = await env.DB.prepare(
    'SELECT id, user_id, expires_at FROM sessions WHERE id = ?'
  ).bind(token).first<{ id: string; user_id: string; expires_at: string }>();

  if (!session) return null;
  if (new Date(session.expires_at) <= new Date()) return null;

  // Cache in KV for future requests
  await env.SESSION_CACHE.put(`session:${token}`, JSON.stringify({
    user_id: session.user_id,
    expires_at: session.expires_at,
  }), { expirationTtl: 3600 });

  return session;
}

async function resolveApiKey(env: Env, key: string): Promise<{ user_id: string; permissions: string[] } | null> {
  const keyHash = await hashApiKey(key);

  // Check KV cache first
  const cached = await env.API_KEY_CACHE.get(`key:${keyHash}`);
  if (cached) {
    const data = JSON.parse(cached);
    if (data.expires_at && new Date(data.expires_at) <= new Date()) return null;
    return data;
  }

  // Fallback to D1
  const row = await env.DB.prepare(
    'SELECT id, user_id, permissions, expires_at FROM api_keys WHERE key_hash = ?'
  ).bind(keyHash).first<{ id: string; user_id: string; permissions: string; expires_at: string | null }>();

  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return null;

  const permissions = JSON.parse(row.permissions);
  const data = { user_id: row.user_id, permissions, expires_at: row.expires_at };

  // Cache in KV
  await env.API_KEY_CACHE.put(`key:${keyHash}`, JSON.stringify(data), { expirationTtl: 300 });

  return data;
}

async function resolveUser(env: Env, userId: string): Promise<any> {
  return env.DB.prepare(
    'SELECT id, github_id, google_id, username, display_name, email, avatar_url, role, plan, scenario, created_at, updated_at FROM users WHERE id = ?'
  ).bind(userId).first();
}

export function authMiddleware() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const env = c.env;
    let user = null;

    // Try session cookie first
    const cookies = parseCookies(c.req.header('Cookie'));
    const sessionToken = cookies['session'];

    if (sessionToken) {
      // Try KV first, then D1
      const session = await resolveSessionFromKV(env, sessionToken) ?? await resolveSessionFromD1(env, sessionToken);
      if (session) {
        user = await resolveUser(env, session.user_id);
      }
    }

    // Try API key if no session
    if (!user) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer sk-')) {
        const apiKey = authHeader.slice(7); // Remove 'Bearer '
        const keyData = await resolveApiKey(env, apiKey);
        if (keyData) {
          user = await resolveUser(env, keyData.user_id);
        }
      }
    }

    if (user) {
      c.set('user', user);
    }

    await next();
  });
}

export function requireAuth() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
    }
    await next();
  });
}

const ROLE_HIERARCHY: Record<string, number> = {
  user: 0,
  developer: 1,
  admin: 2,
};

export function requireRole(role: string) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[role] ?? 0;

    if (userLevel < requiredLevel) {
      return c.json({ success: false, error: '權限不足', data: null }, 403);
    }

    await next();
  });
}
