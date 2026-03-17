import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser } from '../helpers.js';

describe('Auth Middleware', () => {
  let app: Hono<{ Bindings: Env; Variables: { user: any; session: any } }>;
  let mockEnv: Env;

  beforeEach(async () => {
    const { authMiddleware, requireAuth, requireRole } = await import('../../src/middleware/auth.js');

    mockEnv = createMockEnv();
    app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

    app.use('*', authMiddleware());

    app.get('/public', (c) => c.json({ user: c.get('user') ?? null }));

    app.get('/protected', requireAuth(), (c) => c.json({ user: c.get('user') }));

    app.get('/admin', requireAuth(), requireRole('admin'), (c) => c.json({ ok: true }));

    app.get('/developer', requireAuth(), requireRole('developer'), (c) => c.json({ ok: true }));
  });

  describe('Session cookie validation', () => {
    it('should set user from valid session cookie via KV', async () => {
      const user = createMockUser();
      const sessionStore: Record<string, string> = {
        'session:valid-token': JSON.stringify({
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      };

      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(sessionStore),
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('users')) return user;
            return null;
          },
        }),
      });

      const res = await app.request('/public', {
        headers: { Cookie: 'session=valid-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeTruthy();
      expect(data.user.id).toBe('user-123');
    });

    it('should return null user for expired session', async () => {
      const sessionStore: Record<string, string> = {
        'session:expired-token': JSON.stringify({
          user_id: 'user-123',
          expires_at: new Date(Date.now() - 3600000).toISOString(),
        }),
      };

      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(sessionStore),
      });

      const res = await app.request('/public', {
        headers: { Cookie: 'session=expired-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it('should return null user when no session cookie', async () => {
      const res = await app.request('/public', {}, mockEnv);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it('should fallback to D1 when session not in KV', async () => {
      const user = createMockUser();
      const session = {
        id: 'session-id',
        user_id: 'user-123',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        created_at: '2025-01-01T00:00:00Z',
      };

      const kvStore: Record<string, string> = {};
      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(kvStore),
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('sessions')) return session;
            if (query.includes('users')) return user;
            return null;
          },
        }),
      });

      const res = await app.request('/public', {
        headers: { Cookie: 'session=d1-fallback-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeTruthy();
    });
  });

  describe('API key validation', () => {
    it('should authenticate with valid API key via KV cache', async () => {
      const user = createMockUser({ role: 'developer' });
      // API key cache stores pre-fetched key data
      const keyData = {
        user_id: 'user-123',
        permissions: ['read', 'write'],
        expires_at: null,
      };
      const kvStore: Record<string, string> = {};

      mockEnv = createMockEnv({
        API_KEY_CACHE: createMockKV(kvStore),
        DB: createMockDB({
          firstFn: (query, params) => {
            if (query.includes('api_keys')) return {
              id: 'key-1',
              user_id: 'user-123',
              permissions: '["read","write"]',
              expires_at: null,
            };
            if (query.includes('users')) return user;
            return null;
          },
        }),
      });

      const res = await app.request('/public', {
        headers: { Authorization: 'Bearer sk-testapikey123456' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeTruthy();
    });

    it('should reject invalid API key', async () => {
      mockEnv = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });

      const res = await app.request('/protected', {
        headers: { Authorization: 'Bearer sk-invalidkey' },
      }, mockEnv);

      expect(res.status).toBe(401);
    });

    it('should reject expired API key', async () => {
      mockEnv = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('api_keys')) return {
              id: 'key-1',
              user_id: 'user-123',
              permissions: '["read"]',
              expires_at: new Date(Date.now() - 86400000).toISOString(),
            };
            return null;
          },
        }),
      });

      const res = await app.request('/protected', {
        headers: { Authorization: 'Bearer sk-expiredkey1234' },
      }, mockEnv);

      expect(res.status).toBe(401);
    });
  });

  describe('requireAuth middleware', () => {
    it('should block unauthenticated requests', async () => {
      const res = await app.request('/protected', {}, mockEnv);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('should pass authenticated requests', async () => {
      const user = createMockUser();
      const sessionStore: Record<string, string> = {
        'session:auth-token': JSON.stringify({
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      };

      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(sessionStore),
        DB: createMockDB({ firstFn: () => user }),
      });

      const res = await app.request('/protected', {
        headers: { Cookie: 'session=auth-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
    });
  });

  describe('requireRole middleware', () => {
    it('should block wrong role', async () => {
      const user = createMockUser({ role: 'user' });
      const sessionStore: Record<string, string> = {
        'session:user-token': JSON.stringify({
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      };

      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(sessionStore),
        DB: createMockDB({ firstFn: () => user }),
      });

      const res = await app.request('/admin', {
        headers: { Cookie: 'session=user-token' },
      }, mockEnv);

      expect(res.status).toBe(403);
    });

    it('should pass correct role', async () => {
      const user = createMockUser({ role: 'admin' });
      const sessionStore: Record<string, string> = {
        'session:admin-token': JSON.stringify({
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      };

      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(sessionStore),
        DB: createMockDB({ firstFn: () => user }),
      });

      const res = await app.request('/admin', {
        headers: { Cookie: 'session=admin-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
    });

    it('should allow admin access to developer routes', async () => {
      const user = createMockUser({ role: 'admin' });
      const sessionStore: Record<string, string> = {
        'session:admin-token': JSON.stringify({
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      };

      mockEnv = createMockEnv({
        SESSION_CACHE: createMockKV(sessionStore),
        DB: createMockDB({ firstFn: () => user }),
      });

      const res = await app.request('/developer', {
        headers: { Cookie: 'session=admin-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
    });
  });

  describe('hashApiKey', () => {
    it('should produce consistent SHA-256 hash', async () => {
      const { hashApiKey } = await import('../../src/middleware/auth.js');
      const hash1 = await hashApiKey('sk-testkey123');
      const hash2 = await hashApiKey('sk-testkey123');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different keys', async () => {
      const { hashApiKey } = await import('../../src/middleware/auth.js');
      const hash1 = await hashApiKey('sk-key1');
      const hash2 = await hashApiKey('sk-key2');
      expect(hash1).not.toBe(hash2);
    });
  });
});
