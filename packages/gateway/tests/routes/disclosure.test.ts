import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockServer } from '../helpers.js';

describe('Disclosure Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createApp(env: Env, user: any = null) {
    const { disclosureRoutes } = await import('../../src/routes/disclosure.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });
    app.route('/api/disclosure', disclosureRoutes);
    return app;
  }

  const disclosedServer = createMockServer({
    review_status: 'scan_passed',
    is_published: 0,
    disclosed_at: '2026-03-20T00:00:00Z',
    disclosure_ends_at: '2026-03-25T00:00:00Z',
    trust_votes: 3,
    distrust_votes: 1,
    open_reports: 0,
    owner_username: 'testuser',
    owner_display_name: 'Test User',
  });

  describe('GET /api/disclosure', () => {
    it('should return list of disclosed servers', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [disclosedServer] }),
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/disclosure', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].slug).toBe('test-server');
    });

    it('should return empty list when no servers in disclosure', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [] }),
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/disclosure', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });

  describe('GET /api/disclosure/:slug', () => {
    it('should return disclosure detail for a server', async () => {
      const report = {
        id: 'report-1',
        server_id: 'server-123',
        version: '1.0.0',
        layer: 1,
        status: 'pass',
        details: '{}',
        created_at: '2026-03-20T00:00:00Z',
      };

      let firstCallCount = 0;
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => {
            firstCallCount++;
            if (firstCallCount === 1) return disclosedServer;
            return report;
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/disclosure/test-server', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.server).toBeTruthy();
      expect(data.data.server.slug).toBe('test-server');
      expect(data.data.scanReport).toBeTruthy();
      expect(data.data.scanReport.id).toBe('report-1');
    });

    it('should return 404 for non-existent server', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/disclosure/nonexistent', {}, env);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/disclosure/:slug/vote', () => {
    const loggedInUser = createMockUser();

    it('should cast trust vote', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'server-123' }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, loggedInUser);

      const res = await app.request('/api/disclosure/test-server/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 'trust' }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.vote).toBe('trust');
    });

    it('should upsert existing vote (change from trust to distrust)', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'server-123' }),
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, loggedInUser);

      const res = await app.request('/api/disclosure/test-server/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 'distrust' }),
      }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.vote).toBe('distrust');
    });

    it('should reject unauthenticated (401)', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/disclosure/test-server/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 'trust' }),
      }, env);
      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
    });

    it('should reject invalid vote (400)', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'server-123' }),
        }),
      });
      const app = await createApp(env, loggedInUser);

      const res = await app.request('/api/disclosure/test-server/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 'invalid-vote' }),
      }, env);
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid vote');
    });

    it('should return 404 for server not in disclosure', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });
      const app = await createApp(env, loggedInUser);

      const res = await app.request('/api/disclosure/nonexistent/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 'trust' }),
      }, env);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });
});
