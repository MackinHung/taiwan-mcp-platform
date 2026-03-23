import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser } from '../helpers.js';

describe('Admin Disclosure Routes', () => {
  const adminUser = createMockUser({ role: 'admin' });
  const regularUser = createMockUser({ role: 'user' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('POST /api/admin/disclosure/:serverId/expedite', () => {
    it('should allow admin to expedite (immediate publish)', async () => {
      let firstCallCount = 0;
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => {
            firstCallCount++;
            if (firstCallCount === 1) {
              return { id: 'srv-1', version: '1.0.0' };
            }
            return null;
          },
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/srv-1/expedite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Urgent production fix needed' }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('srv-1');
      expect(data.data.status).toBe('approved');
    });

    it('should require reason', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', version: '1.0.0' }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/srv-1/expedite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }, env);
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('原因');
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/disclosure/srv-1/expedite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'I want to bypass disclosure' }),
      }, env);
      expect(res.status).toBe(403);
    });

    it('should return 404 when server not in disclosure', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/nonexistent/expedite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Trying to expedite a non-existent server' }),
      }, env);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('不存在');
    });
  });

  describe('POST /api/admin/disclosure/:serverId/extend', () => {
    it('should extend disclosure period', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', disclosure_ends_at: '2026-03-25T00:00:00Z' }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/srv-1/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('srv-1');
      expect(data.data.disclosure_ends_at).toBeTruthy();

      // Verify the new end date is 7 days after the original
      const originalEnd = new Date('2026-03-25T00:00:00Z').getTime();
      const newEnd = new Date(data.data.disclosure_ends_at).getTime();
      const diffDays = (newEnd - originalEnd) / 86_400_000;
      expect(diffDays).toBe(7);
    });

    it('should reject invalid days (0)', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', disclosure_ends_at: '2026-03-25T00:00:00Z' }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/srv-1/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 0 }),
      }, env);
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('1-30');
    });

    it('should reject invalid days (31 exceeds max)', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', disclosure_ends_at: '2026-03-25T00:00:00Z' }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/srv-1/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 31 }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/disclosure/srv-1/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 5 }),
      }, env);
      expect(res.status).toBe(403);
    });

    it('should return 404 when server not in disclosure', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/disclosure/nonexistent/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 3 }),
      }, env);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('不存在');
    });
  });

  describe('PATCH /api/admin/servers/:id/official', () => {
    it('should toggle is_official to true', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', is_official: 0 }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/servers/srv-1/official', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_official: true }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('srv-1');
      expect(data.data.is_official).toBe(true);
    });

    it('should toggle is_official to false', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', is_official: 1 }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/servers/srv-1/official', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_official: false }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.is_official).toBe(false);
    });

    it('should reject non-admin (403)', async () => {
      const env = createMockEnv();
      const app = await createApp(env, regularUser);

      const res = await app.request('/api/admin/servers/srv-1/official', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_official: true }),
      }, env);
      expect(res.status).toBe(403);
    });

    it('should return 404 when server not found', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/servers/nonexistent/official', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_official: true }),
      }, env);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('不存在');
    });

    it('should reject invalid body', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'srv-1', is_official: 0 }),
        }),
      });
      const app = await createApp(env, adminUser);

      const res = await app.request('/api/admin/servers/srv-1/official', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_official: 'yes' }),
      }, env);
      expect(res.status).toBe(400);
    });
  });
});
