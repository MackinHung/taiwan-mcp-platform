import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockKV } from '../helpers.js';
import { privacyRoutes } from '../../src/routes/privacy.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

function createApp(user: any, envOverrides: Partial<Env> = {}) {
  const env = createMockEnv(envOverrides);
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    if (user) c.set('user', user);
    await next();
  });
  app.route('/api/privacy', privacyRoutes);
  return { app, env };
}

describe('Privacy Routes', () => {
  describe('GET /api/privacy/my-data', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { app, env } = createApp(null);
      const res = await app.request('/api/privacy/my-data', {}, env);
      expect(res.status).toBe(401);
    });

    it('should return user data for authenticated users', async () => {
      const user = createMockUser();
      const mockDB = createMockDB({
        firstFn: (query) => {
          if (query.includes('FROM users')) {
            return { id: user.id, username: 'testuser', email: 'test@example.com' };
          }
          return null;
        },
        allFn: (query) => {
          if (query.includes('FROM api_keys')) return { results: [{ id: 'key-1', name: 'test key' }] };
          if (query.includes('FROM sessions')) return { results: [] };
          if (query.includes('FROM usage_daily')) return { results: [] };
          if (query.includes('FROM stars')) return { results: [] };
          if (query.includes('FROM compositions')) return { results: [] };
          if (query.includes('FROM reports')) return { results: [] };
          return { results: [] };
        },
      });
      const { app, env } = createApp(user, { DB: mockDB });

      const res = await app.request('/api/privacy/my-data', {}, env);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('profile');
      expect(json.data).toHaveProperty('api_keys');
      expect(json.data).toHaveProperty('sessions');
      expect(json.data).toHaveProperty('usage_history');
      expect(json.data).toHaveProperty('stars');
      expect(json.data).toHaveProperty('compositions');
      expect(json.data).toHaveProperty('reports');
      expect(json.data).toHaveProperty('data_retention');
    });

    it('should include data retention information', async () => {
      const user = createMockUser();
      const { app, env } = createApp(user);

      const res = await app.request('/api/privacy/my-data', {}, env);
      const json = await res.json();
      expect(json.data.data_retention.profile).toBe('保留至用戶刪除帳號');
      expect(json.data.data_retention.usage_history).toBe('保留 90 天');
    });
  });

  describe('DELETE /api/privacy/my-data', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { app, env } = createApp(null);
      const res = await app.request('/api/privacy/my-data', { method: 'DELETE' }, env);
      expect(res.status).toBe(401);
    });

    it('should delete user data and return success', async () => {
      const user = createMockUser();
      const deletedTables: string[] = [];
      const kvStore: Record<string, string> = {};

      const mockDB = createMockDB({
        allFn: (query) => {
          if (query.includes('FROM api_keys')) return { results: [{ key_hash: 'hash123' }] };
          if (query.includes('FROM compositions')) return { results: [{ id: 'comp-1' }] };
          if (query.includes('FROM sessions')) return { results: [{ id: 'sess-1' }] };
          return { results: [] };
        },
        runFn: (query) => {
          if (query.includes('DELETE FROM')) {
            const match = query.match(/DELETE FROM (\w+)/);
            if (match) deletedTables.push(match[1]);
          }
          return { success: true, meta: { changes: 1 } };
        },
      });

      const { app, env } = createApp(user, {
        DB: mockDB,
        API_KEY_CACHE: createMockKV(kvStore),
        SESSION_CACHE: createMockKV(kvStore),
      });

      const res = await app.request('/api/privacy/my-data', { method: 'DELETE' }, env);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.message).toContain('已刪除');

      // Verify correct deletion order
      expect(deletedTables).toContain('stars');
      expect(deletedTables).toContain('reports');
      expect(deletedTables).toContain('usage_daily');
      expect(deletedTables).toContain('api_keys');
      expect(deletedTables).toContain('compositions');
      expect(deletedTables).toContain('sessions');
      expect(deletedTables).toContain('users');
    });
  });

  describe('POST /api/privacy/requests', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { app, env } = createApp(null);
      const res = await app.request('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'query', description: 'I want my data' }),
      }, env);
      expect(res.status).toBe(401);
    });

    it('should reject invalid request type', async () => {
      const user = createMockUser();
      const { app, env } = createApp(user);

      const res = await app.request('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid', description: 'test description text' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should reject short descriptions', async () => {
      const user = createMockUser();
      const { app, env } = createApp(user);

      const res = await app.request('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'query', description: 'short' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should accept valid privacy requests', async () => {
      const user = createMockUser();
      const { app, env } = createApp(user);

      const res = await app.request('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'query', description: '我想查詢平台持有的所有個人資料' }),
      }, env);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('query');
      expect(json.data.status).toBe('pending');
    });

    it('should accept all valid request types', async () => {
      const user = createMockUser();
      for (const type of ['query', 'correction', 'deletion', 'stop_processing']) {
        const { app, env } = createApp(user);
        const res = await app.request('/api/privacy/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, description: `我要提出 ${type} 請求來處理我的資料` }),
        }, env);
        expect(res.status).toBe(201);
      }
    });
  });

  describe('GET /api/privacy/requests', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { app, env } = createApp(null);
      const res = await app.request('/api/privacy/requests', {}, env);
      expect(res.status).toBe(401);
    });

    it('should return user privacy requests', async () => {
      const user = createMockUser();
      const mockDB = createMockDB({
        allFn: () => ({
          results: [
            { id: 'req-1', type: 'query', description: 'test', status: 'pending', created_at: '2026-01-01' },
          ],
        }),
      });
      const { app, env } = createApp(user, { DB: mockDB });

      const res = await app.request('/api/privacy/requests', {}, env);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].type).toBe('query');
    });
  });
});
