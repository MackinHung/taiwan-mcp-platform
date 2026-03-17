import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser } from '../helpers.js';

describe('Composition Routes', () => {
  const mockUser = createMockUser();

  async function createApp(env: Env, user: any = null) {
    const { compositionRoutes } = await import('../../src/routes/compositions.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });
    app.route('/api/compositions', compositionRoutes);
    return app;
  }

  describe('GET /api/compositions', () => {
    it('should list user compositions', async () => {
      const composition = {
        id: 'comp-1', user_id: 'user-123', name: 'My Comp',
        description: 'Test', scenario: null, endpoint_slug: 'my-comp',
        is_active: 1, created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [composition] }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/compositions', {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/compositions', () => {
    it('should create composition with valid input', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null, // no slug conflict
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Composition',
          endpoint_slug: 'my-composition',
          description: 'A test composition',
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it('should reject invalid slug', async () => {
      const env = createMockEnv();
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Composition',
          endpoint_slug: 'INVALID SLUG!',
        }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should reject duplicate slug', async () => {
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'existing-comp' }), // slug exists
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Composition',
          endpoint_slug: 'existing-comp',
        }),
      }, env);
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/compositions/:id', () => {
    it('should return composition detail with servers', async () => {
      const composition = {
        id: 'comp-1', user_id: 'user-123', name: 'My Comp',
        description: 'Test', scenario: null, endpoint_slug: 'my-comp',
        is_active: 1, created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };
      const compServer = {
        id: 'cs-1', composition_id: 'comp-1', server_id: 'server-123',
        namespace_prefix: 'weather', enabled: 1, added_at: '2025-01-01T00:00:00Z',
        server_name: 'Weather Server', server_slug: 'taiwan-weather',
      };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => composition,
          allFn: () => ({ results: [compServer] }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/comp-1', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.servers).toHaveLength(1);
    });

    it('should return 404 for missing composition', async () => {
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/nonexistent', {}, env);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/compositions/:id', () => {
    it('should update composition', async () => {
      const composition = {
        id: 'comp-1', user_id: 'user-123', name: 'My Comp',
        endpoint_slug: 'my-comp',
      };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => composition,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/comp-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      }, env);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/compositions/:id', () => {
    it('should delete composition', async () => {
      const composition = { id: 'comp-1', user_id: 'user-123' };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => composition,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/comp-1', { method: 'DELETE' }, env);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/compositions/:id/servers', () => {
    it('should add server with namespace', async () => {
      const composition = { id: 'comp-1', user_id: 'user-123' };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('compositions') && query.includes('id')) return composition;
            if (query.includes('composition_servers') && query.includes('namespace_prefix')) return null; // no conflict
            if (query.includes('servers') && query.includes('id')) return { id: 'server-123' };
            return null;
          },
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/comp-1/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_id: 'server-123', namespace_prefix: 'weather' }),
      }, env);
      expect(res.status).toBe(201);
    });

    it('should reject duplicate prefix', async () => {
      const composition = { id: 'comp-1', user_id: 'user-123' };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('compositions') && query.includes('id')) return composition;
            if (query.includes('composition_servers') && query.includes('namespace_prefix')) return { id: 'existing' }; // conflict!
            return null;
          },
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/comp-1/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_id: 'server-123', namespace_prefix: 'weather' }),
      }, env);
      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /api/compositions/:id/servers/:serverId', () => {
    it('should remove server from composition', async () => {
      const composition = { id: 'comp-1', user_id: 'user-123' };

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => composition,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, mockUser);

      const res = await app.request('/api/compositions/comp-1/servers/cs-1', { method: 'DELETE' }, env);
      expect(res.status).toBe(200);
    });
  });
});
