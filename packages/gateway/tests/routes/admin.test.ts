import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockServer } from '../helpers.js';

describe('Admin Routes', () => {
  const adminUser = createMockUser({ role: 'admin' });
  const regularUser = createMockUser({ role: 'user' });

  async function createApp(env: Env, user: any = null) {
    const { adminRoutes } = await import('../../src/routes/admin.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });
    app.route('/api/admin', adminRoutes);
    return app;
  }

  describe('GET /api/admin/review-queue', () => {
    it('should list pending reviews for admin', async () => {
      const server = createMockServer({ review_status: 'pending_scan' });
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [server] }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/review-queue', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/review-queue', {}, env);
      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/admin/review-queue', {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/review/:serverId', () => {
    it('should approve server', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => createMockServer({ review_status: 'human_review' }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/review/server-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', notes: 'Looks good' }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it('should reject server', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => createMockServer({ review_status: 'human_review' }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/review/server-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', notes: 'Security concerns' }),
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return platform statistics', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('users')) return { count: 100 };
            if (query.includes('servers')) return { count: 25 };
            if (query.includes('usage_daily')) return { total: 50000 };
            return { count: 0 };
          },
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/stats', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toBeTruthy();
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list users for admin', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [createMockUser()] }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/users', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user role', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => createMockUser(),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/users/user-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'developer' }),
      }, env);
      expect(res.status).toBe(200);
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/users/user-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'developer' }),
      }, env);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('should list all reports for admin', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({
            results: [{
              id: 'report-1', user_id: 'user-1', server_id: 'srv-1',
              type: 'security', description: 'XSS vulnerability', status: 'open',
              server_name: 'Test Server', server_slug: 'test-server',
              reporter_username: 'testuser', reporter_display_name: 'Test User',
              created_at: '2025-01-01T00:00:00Z',
            }],
          }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/reports', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].server_name).toBe('Test Server');
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/reports', {}, env);
      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated (401)', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/admin/reports', {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/admin/reports/:id', () => {
    it('should update report status', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'report-1' }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/reports/report-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'investigating' }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('investigating');
    });

    it('should return 404 for non-existent report', async () => {
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/reports/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      }, env);
      expect(res.status).toBe(404);
    });

    it('should reject invalid status', async () => {
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => ({ id: 'report-1' }) }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/reports/report-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'invalid' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/reports/report-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      }, env);
      expect(res.status).toBe(403);
    });
  });
});
