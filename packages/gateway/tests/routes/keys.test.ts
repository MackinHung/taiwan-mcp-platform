import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser } from '../helpers.js';

describe('API Key Routes', () => {
  const mockUser = createMockUser();

  async function createApp(env: Env, user: any = null) {
    const { keyRoutes } = await import('../../src/routes/keys.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });
    app.route('/api/keys', keyRoutes);
    return app;
  }

  describe('GET /api/keys', () => {
    it('should list user API keys', async () => {
      const key = {
        id: 'key-1', user_id: 'user-123', name: 'My Key',
        key_prefix: 'sk-abc...', permissions: '["read"]',
        last_used_at: null, expires_at: null,
        created_at: '2025-01-01T00:00:00Z',
      };

      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [key] }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/keys', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      // Should NOT include key_hash
      expect(data.data[0].key_hash).toBeUndefined();
    });

    it('should require authentication', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/keys', {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/keys', () => {
    it('should create new key and return full key once', async () => {
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({
        API_KEY_CACHE: createMockKV(kvStore),
        DB: createMockDB({
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My New Key', permissions: ['read'] }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.key).toBeTruthy();
      expect(data.data.key).toMatch(/^sk-/);
    });

    it('should reject invalid input', async () => {
      const env = createMockEnv();
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }), // invalid: empty name
      }, env);
      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Key', permissions: ['read'] }),
      }, env);
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/keys/:id', () => {
    it('should delete key', async () => {
      const key = { id: 'key-1', user_id: 'user-123', key_hash: 'abc123' };
      const kvStore: Record<string, string> = {};

      const env = createMockEnv({
        API_KEY_CACHE: createMockKV(kvStore),
        DB: createMockDB({
          firstFn: () => key,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/keys/key-1', { method: 'DELETE' }, env);
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent key', async () => {
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/keys/nonexistent', { method: 'DELETE' }, env);
      expect(res.status).toBe(404);
    });

    it('should prevent deleting another user key', async () => {
      const key = { id: 'key-1', user_id: 'other-user', key_hash: 'abc123' };
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => key }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/keys/key-1', { method: 'DELETE' }, env);
      expect(res.status).toBe(404);
    });
  });
});
