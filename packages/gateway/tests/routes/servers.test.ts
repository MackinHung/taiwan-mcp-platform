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
          allFn: (query) => {
            if (query.includes('COUNT')) return { results: [{ total: 1 }] };
            if (query.includes('servers')) return { results: [server] };
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
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
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
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
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
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
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
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 50 }] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers?page=2&limit=10', {}, env);
      expect(res.status).toBe(200);
      expect(capturedQuery).toContain('OFFSET');
    });

    it('should sort by popular (default)', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers', {}, env);
      expect(capturedQuery).toContain('total_calls DESC');
    });

    it('should sort by stars', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers?sort=stars', {}, env);
      expect(capturedQuery).toContain('total_stars DESC');
    });

    it('should sort by newest', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers?sort=newest', {}, env);
      expect(capturedQuery).toContain('created_at DESC');
    });

    it('should sort by name', async () => {
      let capturedQuery = '';
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query) => {
            capturedQuery = query;
            if (query.includes('COUNT')) return { results: [{ total: 0 }] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      await app.request('/api/servers?sort=name', {}, env);
      expect(capturedQuery).toContain('name ASC');
    });

    it('should include owner info and tools_count via JOIN', async () => {
      const server = createMockServer({ owner_username: 'admin', owner_display_name: 'Admin', tools_count: 5 });
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query) => {
            if (query.includes('LEFT JOIN users')) return { results: [server] };
            if (query.includes('COUNT')) return { results: [{ total: 1 }] };
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers', {}, env);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data[0].owner_username).toBe('admin');
      expect(data.data[0].owner_display_name).toBe('Admin');
      expect(data.data[0].tools_count).toBe(5);
    });
  });

  describe('GET /api/servers/stats', () => {
    it('should return aggregate stats', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('total_published'))
              return { total_published: 5, total_tools: 30, total_calls: 18080 };
            return null;
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/stats', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.total_published).toBe(5);
      expect(data.data.total_tools).toBe(30);
      expect(data.data.total_calls).toBe(18080);
    });

    it('should return zeros when no servers exist', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/stats', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.data.total_published).toBe(0);
      expect(data.data.total_tools).toBe(0);
      expect(data.data.total_calls).toBe(0);
    });
  });

  describe('GET /api/servers/:slug', () => {
    it('should return server detail with tools and owner info', async () => {
      const server = createMockServer({ owner_username: 'testuser', owner_display_name: 'Test User' });
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
      expect(data.data.owner_username).toBe('testuser');
      expect(data.data.owner_display_name).toBe('Test User');
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
