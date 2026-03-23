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

describe('Upload Routes — Disclosure Period', () => {
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

  describe('POST /api/upload (new server with source_code enters disclosure)', () => {
    it('new server (version 0.1.0 or null) gets 5 days disclosure', async () => {
      const user = createMockUser({ role: 'developer' });
      const queries: { query: string; params: any[] }[] = [];
      const r2 = createMockR2();

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query, params) => {
            queries.push({ query, params });
            // First call: slug check → no conflict
            // Later calls from runScanAndPersist: server version lookup
            if (query.includes('SELECT version FROM servers')) {
              return { version: null };
            }
            return null;
          },
          runFn: (query, params) => {
            queries.push({ query, params });
            return { success: true, meta: { changes: 1 } };
          },
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const sourceCode = btoa('const x = 1;');
      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'brand-new-server',
          name: 'Brand New Server',
          description: 'A brand new server entering disclosure period',
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

      // Verify the server is NOT immediately published
      const publishQuery = queries.find(
        (q) => q.query.includes('is_published') && q.query.includes('= 1') && !q.query.includes('is_published = 0')
          && !q.query.includes('INSERT'),
      );
      // There should be no UPDATE setting is_published=1
      // Instead, there should be a disclosure query
      const disclosureQuery = queries.find(
        (q) => q.query.includes('disclosed_at') && q.query.includes('disclosure_ends_at'),
      );
      expect(disclosureQuery).toBeTruthy();

      // Verify review_status is set to 'scan_passed' (not 'approved')
      const scanPassedQuery = queries.find(
        (q) => q.query.includes("review_status='scan_passed'") && q.query.includes('disclosed_at'),
      );
      expect(scanPassedQuery).toBeTruthy();
    });

    it('scan passed enters disclosure period (NOT auto-approved, NOT published)', async () => {
      const user = createMockUser({ role: 'developer' });
      const queries: { query: string; params: any[] }[] = [];
      const r2 = createMockR2();

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query, params) => {
            queries.push({ query, params });
            if (query.includes('SELECT version FROM servers')) {
              return { version: '0.1.0' };
            }
            return null;
          },
          runFn: (query, params) => {
            queries.push({ query, params });
            return { success: true, meta: { changes: 1 } };
          },
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const sourceCode = btoa('export function hello() { return "world"; }');
      const res = await app.request('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'disclosure-server',
          name: 'Disclosure Server',
          description: 'A server that should enter disclosure after scan',
          category: 'utility',
          version: '1.0.0',
          source_code: sourceCode,
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify: no query sets is_published=1 via UPDATE
      const autoPublishQuery = queries.find(
        (q) => q.query.includes('UPDATE') && q.query.includes('is_published=1'),
      );
      expect(autoPublishQuery).toBeUndefined();

      // Verify: disclosed_at is set
      const disclosureSetQuery = queries.find(
        (q) => q.query.includes('UPDATE') && q.query.includes('disclosed_at'),
      );
      expect(disclosureSetQuery).toBeTruthy();

      // Verify: review_status stays 'scan_passed' (not 'approved')
      const approvedQuery = queries.find(
        (q) => q.query.includes('UPDATE') && q.query.includes("review_status='approved'"),
      );
      expect(approvedQuery).toBeUndefined();
    });
  });

  describe('POST /api/upload/:slug/versions (version update disclosure)', () => {
    it('patch update (same major.minor) gets 2 days disclosure', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123', version: '1.0.0' });
      const queries: { query: string; params: any[] }[] = [];
      const r2 = createMockR2();

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query, params) => {
            queries.push({ query, params });
            if (query.includes('SELECT version FROM servers')) {
              return { version: '1.0.0' };
            }
            return server;
          },
          runFn: (query, params) => {
            queries.push({ query, params });
            return { success: true, meta: { changes: 1 } };
          },
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const sourceCode = btoa('const patched = true;');
      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '1.0.1',
          changelog: 'Patch fix',
          source_code: sourceCode,
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.scan.status).toBe('scan_passed');

      // Verify disclosure was set (disclosed_at + disclosure_ends_at)
      const disclosureQuery = queries.find(
        (q) => q.query.includes('disclosed_at') && q.query.includes('disclosure_ends_at'),
      );
      expect(disclosureQuery).toBeTruthy();
    });

    it('minor/major update gets 5 days disclosure', async () => {
      const user = createMockUser({ role: 'developer' });
      const server = createMockServer({ owner_id: 'user-123', version: '1.0.0' });
      const queries: { query: string; params: any[] }[] = [];
      const r2 = createMockR2();

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query, params) => {
            queries.push({ query, params });
            if (query.includes('SELECT version FROM servers')) {
              return { version: '1.0.0' };
            }
            return server;
          },
          runFn: (query, params) => {
            queries.push({ query, params });
            return { success: true, meta: { changes: 1 } };
          },
        }),
        PACKAGES: r2,
      });
      const app = await createApp(env, user);

      const sourceCode = btoa('const majorUpdate = true;');
      const res = await app.request('/api/upload/test-server/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '2.0.0',
          changelog: 'Major update with breaking changes',
          source_code: sourceCode,
        }),
      }, env);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.scan.status).toBe('scan_passed');

      // Verify disclosure was set
      const disclosureQuery = queries.find(
        (q) => q.query.includes('disclosed_at') && q.query.includes('disclosure_ends_at'),
      );
      expect(disclosureQuery).toBeTruthy();

      // Verify server is NOT set to is_published=1
      const autoPublishQuery = queries.find(
        (q) => q.query.includes('UPDATE') && q.query.includes('is_published=1'),
      );
      expect(autoPublishQuery).toBeUndefined();
    });
  });
});
