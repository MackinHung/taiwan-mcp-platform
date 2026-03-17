import { Hono } from 'hono';
import type { Env } from '../env.js';
import { nanoid } from '../lib/nanoid.js';
import { parseCookies } from '../lib/cookie.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const authRoutes = new Hono<HonoEnv>();

// GET /github -> redirect to GitHub OAuth
authRoutes.get('/github', (c) => {
  const env = c.env;
  const state = nanoid(16);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', env.GITHUB_REDIRECT_URI);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);
  return c.redirect(url.toString());
});

// GET /github/callback -> exchange code, upsert user, create session
authRoutes.get('/github/callback', async (c) => {
  const env = c.env;
  const code = c.req.query('code');

  if (!code) {
    return c.json({ success: false, error: 'Missing code parameter', data: null }, 400);
  }

  // Exchange code for access token
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as any;

    if (!tokenData.access_token) {
      return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
    }
    accessToken = tokenData.access_token;
  } catch {
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }

  // Get user info from GitHub
  let ghUser: any;
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'MCP-Platform',
      },
    });
    ghUser = await userRes.json() as any;
  } catch {
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }

  // Upsert user in D1
  const now = new Date().toISOString();
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE github_id = ?'
  ).bind(ghUser.id).first<{ id: string }>();

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    await env.DB.prepare(
      'UPDATE users SET username = ?, display_name = ?, email = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
    ).bind(ghUser.login, ghUser.name || null, ghUser.email || null, ghUser.avatar_url || null, now, userId).run();
  } else {
    userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, github_id, username, display_name, email, avatar_url, role, plan, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'user', 'free', ?, ?)`
    ).bind(userId, ghUser.id, ghUser.login, ghUser.name || null, ghUser.email || null, ghUser.avatar_url || null, now, now).run();
  }

  // Create session
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, userId, expiresAt, now).run();

  // Cache session in KV
  await env.SESSION_CACHE.put(`session:${sessionId}`, JSON.stringify({
    user_id: userId,
    expires_at: expiresAt,
  }), { expirationTtl: 7 * 24 * 3600 });

  // Set cookie and redirect
  const cookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
  return c.redirect(`${env.FRONTEND_URL}`, 302, {
    'Set-Cookie': cookie,
  } as any);
});

// POST /logout -> clear session
authRoutes.post('/logout', async (c) => {
  const env = c.env;
  const cookies = parseCookies(c.req.header('Cookie'));
  const sessionToken = cookies['session'];

  if (sessionToken) {
    await env.SESSION_CACHE.delete(`session:${sessionToken}`);
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionToken).run();
  }

  return c.json({ success: true, data: null, error: null }, 200, {
    'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0',
  } as any);
});

// GET /me -> return current user
authRoutes.get('/me', (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  }
  return c.json({ success: true, data: user, error: null });
});
