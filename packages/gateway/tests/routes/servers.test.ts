import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser, createMockServer } from '../helpers.js';

describe('Server Routes', () => {
  async function createApp(env: Env, user: any = null) {
    const { serverRoutes } = await import('../../src/routes/servers.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });

    app.route('/api/servers', serverRoutes);
    return app;
  }

  describe('GET /api/servers', () => {
    it('should list published servers with pagination', async () => {
      const server = createMockServer();
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('COUNT')) return { total: 1 };
            return null;
          },
          allFn: (query) => {
            if (query.includes('servers') && !query.includes('COUNT'))
              return { results: [server] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.meta).toBeTruthy();
      expect(data.meta.total).toBe(1);
    });

    it('should filter by category', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ total: 0 }),
          allFn: (query) => {
            capturedQuery = query;
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers?category=government', {}, env);
      expect(capturedQuery).toContain('category');
    });

    it('should search by name/description', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ total: 0 }),
          allFn: (query) => {
            capturedQuery = query;
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers?search=%E5%A4%A9%E6%B0%A3', {}, env);
      expect(capturedQuery).toContain('LIKE');
    });

    it('should filter by badge_data', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ total: 0 }),
          allFn: (query) => {
            capturedQuery = query;
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers?badge_data=public', {}, env);
      expect(capturedQuery).toContain('badge_data');
    });

    it('should paginate correctly', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ total: 50 }),
          allFn: (query) => {
            capturedQuery = query;
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers?page=2&limit=10', {}, env);
      expect(res.status).toBe(200);
      expect(capturedQuery).toContain('OFFSET');
    });
  });

  describe('GET /api/servers/:slug', () => {
    it('should return server detail with tools', async () => {
      const server = createMockServer();
      const tool = {
        id: 'tool-1', server_id: 'server-123', name: 'get-weather',
        display_name: 'Get Weather', description: 'Gets weather data',
        input_schema: '{}', output_schema: null, annotations: null,
        created_at: '2025-01-01T00:00:00Z',
      };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('servers') && query.includes('slug')) return server;
            return null;
          },
          allFn: (query) => {
            if (query.includes('tools')) return { results: [tool] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/test-server', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.slug).toBe('test-server');
    });

    it('should return 404 for missing server', async () => {
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/nonexistent', {}, env);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/servers/:slug/tools', () => {
    it('should return tool list', async () => {
      const server = createMockServer();
      const tool = {
        id: 'tool-1', server_id: 'server-123', name: 'get-weather',
        display_name: 'Get Weather', description: 'Gets weather data',
        input_schema: '{}', output_schema: null, annotations: null,
        created_at: '2025-01-01T00:00:00Z',
      };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('servers')) return server;
            return null;
          },
          allFn: (query) => {
            if (query.includes('tools')) return { results: [tool] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/test-server/tools', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });
  });

  describe('POST /api/servers/:slug/star', () => {
    it('should add star when authenticated', async () => {
      const user = createMockUser();
      const server = createMockServer();
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('servers') && query.includes('slug')) return server;
            if (query.includes('stars')) return null; // not yet starred
            return null;
          },
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/test-server/star', { method: 'POST' }, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it('should require authentication', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/servers/test-server/star', { method: 'POST' }, env);
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/servers/:slug/star', () => {
    it('should remove star when authenticated', async () => {
      const user = createMockUser();
      const server = createMockServer();
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('servers')) return server;
            return null;
          },
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/test-server/star', { method: 'DELETE' }, env);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/servers/:slug/report', () => {
    it('should create report when authenticated', async () => {
      const user = createMockUser();
      const server = createMockServer();
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('servers')) return server;
            return null;
          },
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/test-server/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bug', description: 'This is a test bug report with enough detail' }),
      }, env);
      expect(res.status).toBe(201);
    });

    it('should reject invalid report', async () => {
      const user = createMockUser();
      const server = createMockServer();
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => server,
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/test-server/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should require authentication for reports', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/servers/test-server/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bug', description: 'Some bug report description' }),
      }, env);
      expect(res.status).toBe(401);
    });
  });
});
