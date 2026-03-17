import { Hono } from 'hono';
import type { Env } from '../env.js';
import { nanoid } from '../lib/nanoid.js';
import { parseCookies } from '../lib/cookie.js';
import { upsertOAuthUser, createUserSession } from '../lib/oauth.js';
import type { ProviderUserInfo } from '../lib/oauth.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const authRoutes = new Hono<HonoEnv>();

// ── GitHub OAuth ─────────────────────────────────────────────

// GET /github -> redirect to GitHub OAuth
authRoutes.get('/github', async (c) => {
  const env = c.env;
  const state = nanoid(16);
  // Store state in KV with 5-minute TTL for CSRF protection
  await env.SESSION_CACHE.put(`oauth_state:${state}`, '1', { expirationTtl: 300 });
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
  const state = c.req.query('state');

  if (!code || !state) {
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }

  // Validate + consume state (one-time use)
  const stored = await env.SESSION_CACHE.get(`oauth_state:${state}`);
  if (!stored) {
    return c.redirect(`${env.FRONTEND_URL}?error=invalid_state`);
  }
  await env.SESSION_CACHE.delete(`oauth_state:${state}`);

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

  // Upsert user via shared helper
  const info: ProviderUserInfo = {
    provider: 'github',
    provider_id: String(ghUser.id),
    username: ghUser.login,
    display_name: ghUser.name || null,
    email: ghUser.email || null,
    email_verified: !!ghUser.email,
    avatar_url: ghUser.avatar_url || null,
  };

  const { userId } = await upsertOAuthUser(env.DB, info);
  const { cookie } = await createUserSession(env.DB, env.SESSION_CACHE, userId);

  return c.redirect(`${env.FRONTEND_URL}`, 302, {
    'Set-Cookie': cookie,
  } as any);
});

// ── Google OAuth ─────────────────────────────────────────────

// GET /google -> redirect to Google OAuth
authRoutes.get('/google', async (c) => {
  const env = c.env;
  const state = nanoid(16);
  // Store state in KV with 5-minute TTL for CSRF protection
  await env.SESSION_CACHE.put(`oauth_state:${state}`, '1', { expirationTtl: 300 });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return c.redirect(url.toString());
});

// GET /google/callback -> exchange code, userinfo, upsert, session
authRoutes.get('/google/callback', async (c) => {
  const env = c.env;
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state) {
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }

  // Validate + consume state (one-time use)
  const stored = await env.SESSION_CACHE.get(`oauth_state:${state}`);
  if (!stored) {
    return c.redirect(`${env.FRONTEND_URL}?error=invalid_state`);
  }
  await env.SESSION_CACHE.delete(`oauth_state:${state}`);

  // Exchange code for tokens
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
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

  // Get user info from Google
  let gUser: any;
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    gUser = await userRes.json() as any;
  } catch {
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }

  if (!gUser.id) {
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }

  // Upsert user via shared helper
  const info: ProviderUserInfo = {
    provider: 'google',
    provider_id: gUser.id,
    username: gUser.email?.split('@')[0] || `user_${gUser.id.slice(0, 8)}`,
    display_name: gUser.name || null,
    email: gUser.email || null,
    email_verified: gUser.verified_email === true,
    avatar_url: gUser.picture || null,
  };

  const { userId } = await upsertOAuthUser(env.DB, info);
  const { cookie } = await createUserSession(env.DB, env.SESSION_CACHE, userId);

  return c.redirect(`${env.FRONTEND_URL}`, 302, {
    'Set-Cookie': cookie,
  } as any);
});

// ── Logout / Me ──────────────────────────────────────────────

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
    'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; Max-Age=0',
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
