import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser } from '../helpers.js';

describe('Auth Routes', () => {
  let mockEnv: Env;

  async function createApp(env: Env, user: any = null) {
    const { authRoutes } = await import('../../src/routes/auth.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

    // Set user if provided (simulating auth middleware)
    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });

    app.route('/api/auth', authRoutes);
    return app;
  }

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  // ── GitHub OAuth ─────────────────────────────────────────

  describe('GET /api/auth/github', () => {
    it('should redirect to GitHub OAuth URL', async () => {
      const app = await createApp(mockEnv);

      const res = await app.request('/api/auth/github', {}, mockEnv);

      expect(res.status).toBe(302);
      const location = res.headers.get('Location');
      expect(location).toContain('github.com/login/oauth/authorize');
      expect(location).toContain('client_id=test-client-id');
    });

    it('should store OAuth state in KV', async () => {
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({
        SESSION_CACHE: createMockKV(kvStore),
      });

      const app = await createApp(env);
      await app.request('/api/auth/github', {}, env);

      // Should have stored an oauth_state:* key
      const stateKeys = Object.keys(kvStore).filter(k => k.startsWith('oauth_state:'));
      expect(stateKeys).toHaveLength(1);
    });
  });

  describe('GET /api/auth/github/callback', () => {
    it('should redirect with error when missing code or state', async () => {
      const app = await createApp(mockEnv);

      // No code or state
      const res = await app.request('/api/auth/github/callback', {}, mockEnv);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('error=auth_failed');
    });

    it('should reject callback with invalid state', async () => {
      const kvStore: Record<string, string> = {}; // no state stored
      const env = createMockEnv({
        SESSION_CACHE: createMockKV(kvStore),
      });
      const app = await createApp(env);

      const res = await app.request('/api/auth/github/callback?code=valid-code&state=fake-state', {}, env);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('error=invalid_state');
    });

    it('should consume state (one-time use) after verification', async () => {
      const kvStore: Record<string, string> = {
        'oauth_state:test-state-123': '1',
      };
      const env = createMockEnv({
        SESSION_CACHE: createMockKV(kvStore),
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'gh-token' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            id: 12345, login: 'testuser', name: 'Test', email: 'test@x.com', avatar_url: null,
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        );

      try {
        const user = createMockUser();
        const dbEnv = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
          DB: createMockDB({
            firstFn: (query) => {
              if (query.includes('users')) return user;
              return null;
            },
            runFn: () => ({ success: true, meta: { changes: 1 } }),
          }),
        });

        const app = await createApp(dbEnv);
        await app.request('/api/auth/github/callback?code=valid-code&state=test-state-123', {}, dbEnv);

        // State should be consumed (deleted)
        expect(kvStore['oauth_state:test-state-123']).toBeUndefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should handle callback with valid code and state (mock fetch)', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'gh-token', token_type: 'bearer' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        );

      try {
        const user = createMockUser();
        const kvStore: Record<string, string> = { 'oauth_state:valid-state': '1' };
        const env = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
          DB: createMockDB({
            firstFn: (query) => {
              if (query.includes('users')) return user;
              return null;
            },
            runFn: () => ({ success: true, meta: { changes: 1 } }),
          }),
        });

        const app = await createApp(env);

        const res = await app.request('/api/auth/github/callback?code=valid-code&state=valid-state', {}, env);

        // Should redirect to frontend
        expect(res.status).toBe(302);
        const location = res.headers.get('Location');
        expect(location).toContain('localhost:3000');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should handle GitHub API error', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'bad_verification_code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        const kvStore: Record<string, string> = { 'oauth_state:err-state': '1' };
        const env = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
        });
        const app = await createApp(env);
        const res = await app.request('/api/auth/github/callback?code=invalid-code&state=err-state', {}, env);

        expect(res.status).toBe(302);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ── Google OAuth ─────────────────────────────────────────

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth URL', async () => {
      const app = await createApp(mockEnv);

      const res = await app.request('/api/auth/google', {}, mockEnv);

      expect(res.status).toBe(302);
      const location = res.headers.get('Location');
      expect(location).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(location).toContain('client_id=test-google-client-id');
      expect(location).toContain('scope=openid+email+profile');
    });

    it('should include redirect_uri in Google OAuth URL', async () => {
      const app = await createApp(mockEnv);

      const res = await app.request('/api/auth/google', {}, mockEnv);

      const location = res.headers.get('Location');
      expect(location).toContain('redirect_uri=');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should redirect with error when missing code or state', async () => {
      const app = await createApp(mockEnv);

      const res = await app.request('/api/auth/google/callback', {}, mockEnv);

      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('error=auth_failed');
    });

    it('should reject callback with invalid state', async () => {
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({
        SESSION_CACHE: createMockKV(kvStore),
      });
      const app = await createApp(env);

      const res = await app.request('/api/auth/google/callback?code=valid-code&state=bad-state', {}, env);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('error=invalid_state');
    });

    it('should handle callback with valid code and state (mock fetch)', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            access_token: 'google-token',
            token_type: 'Bearer',
            id_token: 'fake-id-token',
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            id: 'g-987654',
            email: 'guser@gmail.com',
            verified_email: true,
            name: 'Google User',
            picture: 'https://lh3.googleusercontent.com/photo',
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        );

      try {
        const kvStore: Record<string, string> = { 'oauth_state:g-state': '1' };
        const env = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
          DB: createMockDB({
            firstFn: (query) => {
              if (query.includes('google_id')) return { id: 'existing-google-user' };
              return null;
            },
            runFn: () => ({ success: true, meta: { changes: 1 } }),
          }),
        });

        const app = await createApp(env);

        const res = await app.request('/api/auth/google/callback?code=valid-google-code&state=g-state', {}, env);

        expect(res.status).toBe(302);
        const location = res.headers.get('Location');
        expect(location).toContain('localhost:3000');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should handle Google token exchange failure', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'invalid_grant' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        const kvStore: Record<string, string> = { 'oauth_state:fail-state': '1' };
        const env = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
        });
        const app = await createApp(env);
        const res = await app.request('/api/auth/google/callback?code=bad-code&state=fail-state', {}, env);

        expect(res.status).toBe(302);
        const location = res.headers.get('Location');
        expect(location).toContain('error=auth_failed');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should handle missing Google user id', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'token' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ email: 'test@gmail.com' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        );

      try {
        const kvStore: Record<string, string> = { 'oauth_state:noid-state': '1' };
        const env = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
        });
        const app = await createApp(env);
        const res = await app.request('/api/auth/google/callback?code=code&state=noid-state', {}, env);

        expect(res.status).toBe(302);
        const location = res.headers.get('Location');
        expect(location).toContain('error=auth_failed');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should create new user via Google OAuth', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'google-token' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            id: 'new-google-id',
            email: 'newuser@gmail.com',
            verified_email: true,
            name: 'New Google User',
            picture: 'https://lh3.googleusercontent.com/new',
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        );

      try {
        const runCalls: any[] = [];
        const kvStore: Record<string, string> = { 'oauth_state:new-state': '1' };
        const env = createMockEnv({
          SESSION_CACHE: createMockKV(kvStore),
          DB: createMockDB({
            firstFn: () => null, // no existing user
            runFn: (query, params) => {
              runCalls.push({ query, params });
              return { success: true, meta: { changes: 1 } };
            },
          }),
        });

        const app = await createApp(env);

        const res = await app.request('/api/auth/google/callback?code=new-user-code&state=new-state', {}, env);

        expect(res.status).toBe(302);
        // Should have inserted a user + a session
        expect(runCalls.length).toBeGreaterThanOrEqual(2);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ── OAuth Security ─────────────────────────────────────────

  describe('OAuth Security', () => {
    it('should set Secure flag on session cookie', async () => {
      const { createUserSession } = await import('../../src/lib/oauth.js');
      const kvStore: Record<string, string> = {};
      const db = createMockDB({
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });
      const kv = createMockKV(kvStore);

      const result = await createUserSession(db as any, kv as any, 'user-123');
      expect(result.cookie).toContain('Secure');
      expect(result.cookie).toContain('HttpOnly');
      expect(result.cookie).toContain('SameSite=Lax');
    });

    it('should not auto-link accounts by email (security fix)', async () => {
      const { upsertOAuthUser } = await import('../../src/lib/oauth.js');

      // User exists with same email but different provider
      const firstFnCalls: string[] = [];
      const runCalls: any[] = [];
      const db = createMockDB({
        firstFn: (query) => {
          firstFnCalls.push(query);
          if (query.includes('github_id')) return null; // no existing github user
          if (query.includes('email')) return { id: 'existing-user-by-email' }; // email exists
          return null;
        },
        runFn: (query, params) => {
          runCalls.push({ query, params });
          return { success: true, meta: { changes: 1 } };
        },
      });

      const result = await upsertOAuthUser(db as any, {
        provider: 'github',
        provider_id: '99999',
        username: 'newuser',
        display_name: 'New User',
        email: 'shared@example.com',
        email_verified: true,
        avatar_url: null,
      });

      // Should create a NEW user, not link to existing
      expect(result.isNewUser).toBe(true);
      // The INSERT should have email=null (since email is taken)
      const insertCall = runCalls.find(c => c.query.includes('INSERT'));
      expect(insertCall).toBeTruthy();
      // Verify email param is null (index 5 in the bind params)
      expect(insertCall.params[5]).toBeNull();
    });

    it('should store email when no conflict exists', async () => {
      const { upsertOAuthUser } = await import('../../src/lib/oauth.js');
      const runCalls: any[] = [];
      const db = createMockDB({
        firstFn: () => null, // no existing user at all
        runFn: (query, params) => {
          runCalls.push({ query, params });
          return { success: true, meta: { changes: 1 } };
        },
      });

      const result = await upsertOAuthUser(db as any, {
        provider: 'github',
        provider_id: '88888',
        username: 'unique',
        display_name: 'Unique User',
        email: 'unique@example.com',
        email_verified: true,
        avatar_url: null,
      });

      expect(result.isNewUser).toBe(true);
      const insertCall = runCalls.find(c => c.query.includes('INSERT'));
      expect(insertCall.params[5]).toBe('unique@example.com');
    });
  });

  // ── Logout / Me ──────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('should clear session and return success', async () => {
      const user = createMockUser();
      const kvStore: Record<string, string> = { 'session:active-token': '{}' };

      const env = createMockEnv({
        SESSION_CACHE: createMockKV(kvStore),
        DB: createMockDB({
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });

      const app = await createApp(env, user);

      const res = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: 'session=active-token' },
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const user = createMockUser();
      const app = await createApp(mockEnv, user);

      const res = await app.request('/api/auth/me', {}, mockEnv);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('user-123');
    });

    it('should return 401 when unauthenticated', async () => {
      const app = await createApp(mockEnv);

      const res = await app.request('/api/auth/me', {}, mockEnv);

      expect(res.status).toBe(401);
    });
  });
});
