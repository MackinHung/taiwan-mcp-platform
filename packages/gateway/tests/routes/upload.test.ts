import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockServer } from '../helpers.js';

describe('Upload Routes', () => {
  async function createApp(env: Env, user: any = null) {
    const { uploadRoutes } = await import('../../src/routes/upload.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });
    app.route('/api/upload', uploadRoutes);
    return app;
  }

  describe('POST /api/upload', () => {
    it('should create new server with developer role', async () => {
      const user = createMockUser({ role: 'developer' });
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null, // no slug conflict
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'my-new-server',
          name: 'My New Server',
          description: 'A test server for upload testing purposes',
          category: 'utility',
          version: '1.0.0',
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it('should reject user role (403)', async () => {
      const user = createMockUser({ role: 'user' });
      const env = createMockEnv();
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'my-server',
          name: 'My Server',
          description: 'A test server for upload testing purposes',
          category: 'utility',
          version: '1.0.0',
        }),
      }, env);
      expect(res.status).toBe(403);
    });

    it('should reject validation errors', async () => {
      const user = createMockUser({ role: 'developer' });
      const env = createMockEnv();
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'x', // too short
          name: '',
          description: 'short',
          category: 'invalid',
        }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should reject duplicate slug', async () => {
      const user = createMockUser({ role: 'developer' });
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => ({ id: 'existing' }), // slug conflict
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'existing-server',
          name: 'My Server',
          description: 'A test server for upload testing purposes',
          category: 'utility',
          version: '1.0.0',
        }),
      }, env);
      expect(res.status).toBe(409);
    });

    it('should require authentication', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'test',
          name: 'Test',
          description: 'A test server description',
          category: 'utility',
          version: '1.0.0',
        }),
      }, env);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/upload/:slug', () => {
    it('should update server metadata', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => server,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Server Name' }),
      }, env);
      expect(res.status).toBe(200);
    });

    it('should reject update for non-owner', async () => {
      const user = createMockUser({ role: 'developer', id: 'other-user' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => server }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      }, env);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/upload/:slug/versions', () => {
    it('should create new version', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => server,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '1.1.0', changelog: 'Bug fixes' }),
      }, env);
      expect(res.status).toBe(201);
    });
  });
});
