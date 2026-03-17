import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockServer, createMockR2 } from '../helpers.js';

// Mock the review pipeline
vi.mock('@review/pipeline.js', () => ({
  runReviewPipeline: vi.fn().mockResolvedValue({
    scanResult: { status: 'scan_passed', hasWarnings: false, results: [], externalUrlsDetected: [], durationMs: 10 },
    externalScan: {
      osv: { provider: 'osv', vulnerabilities: [], scannedAt: '2025-01-01T00:00:00Z' },
      depsDev: { provider: 'deps_dev', scorecardScore: 8, licenses: ['MIT'], dependencyCount: 5, advisoryCount: 0, scannedAt: '2025-01-01T00:00:00Z' },
      overallStatus: 'pass',
    },
    badges: {
      badge_source: 'open',
      badge_data: 'public',
      badge_permission: 'readonly',
      badge_community: 'new',
      badge_external: 'verified',
    },
    report: {
      id: 'report-1',
      server_id: 'server-123',
      version: '1.0.0',
      layer: 1,
      status: 'pass',
      details: {},
      external_urls_detected: null,
      scan_duration_ms: 10,
      created_by: null,
      created_at: '2025-01-01T00:00:00Z',
    },
  }),
}));

describe('Upload Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('GET /api/upload (my servers)', () => {
    it('should list developer own servers', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123', tools_count: 3 });
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [server] }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(1);
    });

    it('should reject user role (403)', async () => {
      const user = createMockUser({ role: 'user' });
      const env = createMockEnv();
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {}, env);
      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated (401)', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/upload', {}, env);
      expect(res.status).toBe(401);
    });
  });

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
      expect(data.data.tools_count).toBe(0);
    });

    it('should create server with tools', async () => {
      const user = createMockUser({ role: 'developer' });
      let insertCount = 0;
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
          runFn: () => { insertCount++; return { success: true, meta: { changes: 1 } }; },
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'my-server-with-tools',
          name: 'Server With Tools',
          description: 'A test server with tools for testing',
          category: 'utility',
          version: '1.0.0',
          tools: [
            { name: 'get_data', display_name: 'Get Data', description: 'Fetch data' },
            { name: 'set_config', description: 'Set configuration' },
          ],
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.tools_count).toBe(2);
      // 1 server INSERT + 2 tool INSERTs = 3 run calls
      expect(insertCount).toBe(3);
    });

    it('should create server with source_code and trigger scan', async () => {
      const user = createMockUser({ role: 'developer' });
      const r2 = createMockR2();
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => null,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const sourceCode = btoa('const x = 1;');
      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'my-scanned-server',
          name: 'Scanned Server',
          description: 'A test server with source code for scanning',
          category: 'utility',
          version: '1.0.0',
          source_code: sourceCode,
          dependencies: { 'lodash': '4.17.21' },
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.scan).not.toBeNull();
      expect(data.data.scan.status).toBe('scan_passed');
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

  describe('GET /api/upload/:slug/versions', () => {
    it('should list version history for owner', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => server,
          allFn: () => ({
            results: [
              { id: 'v1', version: '1.0.0', changelog: 'Initial', review_status: 'approved', created_at: '2025-01-01' },
              { id: 'v2', version: '1.1.0', changelog: 'Update', review_status: 'pending_scan', created_at: '2025-02-01' },
            ],
          }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
    });

    it('should reject non-owner', async () => {
      const user = createMockUser({ role: 'developer', id: 'other-user' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => server }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions', {}, env);
      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent server', async () => {
      const user = createMockUser({ role: 'developer' });
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/nonexistent/versions', {}, env);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/upload/:slug/versions (v2 with source code)', () => {
    it('should create new version without source code', async () => {
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
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.scan).toBeNull();
    });

    it('should create version with source code and auto-scan', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });
      const r2 = createMockR2();

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => server,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const sourceCode = btoa('const x = 1;');
      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '2.0.0',
          changelog: 'Major update',
          source_code: sourceCode,
          dependencies: { 'lodash': '4.17.21' },
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.scan).not.toBeNull();
      expect(data.data.scan.status).toBe('scan_passed');
      expect(data.data.scan.badges).toBeDefined();
      expect(data.data.scan.externalScan).toBeDefined();
    });

    it('should reject invalid semver', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => server }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 'not-semver' }),
      }, env);
      expect(res.status).toBe(400);
    });

    it('should reject non-owner', async () => {
      const user = createMockUser({ role: 'developer', id: 'other-user' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => server }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '2.0.0', source_code: btoa('code') }),
      }, env);
      expect(res.status).toBe(403);
    });

    it('should handle scan failure gracefully', async () => {
      const { runReviewPipeline } = await import('@review/pipeline.js');
      (runReviewPipeline as any).mockRejectedValueOnce(new Error('Scan engine crashed'));

      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });
      const r2 = createMockR2();

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => server,
          runFn: () => ({ success: true, meta: { changes: 1 } }),
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '3.0.0',
          source_code: btoa('bad code'),
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.data.scan.status).toBe('scan_failed');
    });
  });

  describe('GET /api/upload/:slug/versions/:version/source', () => {
    it('should download source for owner', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });
      const r2 = createMockR2();

      // Pre-store source in R2
      await (r2 as any).put('server-123/1.0.0/source.js', 'const x = 1;');

      let callCount = 0;
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query: string) => {
            callCount++;
            if (callCount === 1) return server;
            return { package_r2_key: 'server-123/1.0.0/source.js' };
          },
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions/1.0.0/source', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.source).toBe('const x = 1;');
    });

    it('should reject non-owner download', async () => {
      const user = createMockUser({ role: 'developer', id: 'other-user' });
      const server = createMockServer({ owner_id: 'user-123' });

      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => server }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions/1.0.0/source', {}, env);
      expect(res.status).toBe(403);
    });

    it('should return 404 for version without source', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123' });

      let callCount = 0;
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => {
            callCount++;
            if (callCount === 1) return server;
            return { package_r2_key: null };
          },
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions/1.0.0/source', {}, env);
      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent server', async () => {
      const user = createMockUser({ role: 'developer' });

      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/nonexistent/versions/1.0.0/source', {}, env);
      expect(res.status).toBe(404);
    });

    it('should allow admin to download any source', async () => {
      const user = createMockUser({ role: 'admin', id: 'admin-user' });
      const server = createMockServer({ owner_id: 'user-123' });
      const r2 = createMockR2();
      await (r2 as any).put('server-123/1.0.0/source.js', 'const y = 2;');

      let callCount = 0;
      const env = createMockEnv({
        DB: createMockDB({
          firstFn: () => {
            callCount++;
            if (callCount === 1) return server;
            return { package_r2_key: 'server-123/1.0.0/source.js' };
          },
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/upload/test-server/versions/1.0.0/source', {}, env);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.data.source).toBe('const y = 2;');
    });
  });
});
