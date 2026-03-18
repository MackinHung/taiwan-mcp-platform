import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockServer } from '../helpers.js';

// Mock the rescan module
vi.mock('@review/rescan.js', () => ({
  rescanAll: vi.fn(),
}));

import { rescanAll } from '@review/rescan.js';
const mockRescanAll = vi.mocked(rescanAll);

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

beforeEach(() => {
  vi.clearAllMocks();
  mockRescanAll.mockResolvedValue({
    totalScanned: 0,
    totalChanged: 0,
    results: [],
    completedAt: new Date().toISOString(),
  });
});

describe('POST /api/admin/rescan', () => {
  it('returns 401 when not authenticated', async () => {
    const env = createMockEnv();
    const app = await createApp(env);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
  });

  it('returns 403 when not admin', async () => {
    const env = createMockEnv();
    const app = await createApp(env, regularUser);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
  });

  it('returns 200 with rescan summary for admin', async () => {
    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: [] }),
      }),
    });
    const app = await createApp(env, adminUser);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('calls rescanAll with targets from DB', async () => {
    const servers = [
      { id: 'srv-1', version: '1.0.0', badge_external: 'partial' },
      { id: 'srv-2', version: '2.0.0', badge_external: 'verified' },
    ];
    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: servers }),
      }),
    });
    const app = await createApp(env, adminUser);

    await app.request('/api/admin/rescan', { method: 'POST' }, env);

    expect(mockRescanAll).toHaveBeenCalledWith([
      { serverId: 'srv-1', version: '1.0.0', dependencies: {}, currentBadgeExternal: 'partial' },
      { serverId: 'srv-2', version: '2.0.0', dependencies: {}, currentBadgeExternal: 'verified' },
    ]);
  });

  it('updates badges in DB for changed results', async () => {
    const runCalls: any[] = [];
    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: [{ id: 'srv-1', version: '1.0.0', badge_external: 'unverified' }] }),
        runFn: (_q: string, params: any[]) => { runCalls.push(params); return { success: true, meta: { changes: 1 } }; },
      }),
    });

    mockRescanAll.mockResolvedValue({
      totalScanned: 1,
      totalChanged: 1,
      results: [{
        serverId: 'srv-1',
        version: '1.0.0',
        previousBadge: 'unverified',
        newBadge: 'verified',
        badgeChanged: true,
        vulnerabilitiesFound: 0,
        scannedAt: new Date().toISOString(),
      }],
      completedAt: new Date().toISOString(),
    });

    const app = await createApp(env, adminUser);
    await app.request('/api/admin/rescan', { method: 'POST' }, env);

    expect(runCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty server list', async () => {
    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: [] }),
      }),
    });
    const app = await createApp(env, adminUser);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    expect(res.status).toBe(200);
    expect(mockRescanAll).toHaveBeenCalledWith([]);
  });

  it('returns correct summary structure', async () => {
    mockRescanAll.mockResolvedValue({
      totalScanned: 2,
      totalChanged: 1,
      results: [
        { serverId: 's1', version: '1.0.0', previousBadge: 'partial', newBadge: 'verified', badgeChanged: true, vulnerabilitiesFound: 0, scannedAt: '2026-01-01T00:00:00Z' },
        { serverId: 's2', version: '1.0.0', previousBadge: 'verified', newBadge: 'verified', badgeChanged: false, vulnerabilitiesFound: 0, scannedAt: '2026-01-01T00:00:00Z' },
      ],
      completedAt: '2026-01-01T00:00:00Z',
    });

    const env = createMockEnv({
      DB: createMockDB({ allFn: () => ({ results: [] }) }),
    });
    const app = await createApp(env, adminUser);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    const body = await res.json() as any;
    expect(body.data.totalScanned).toBe(2);
    expect(body.data.totalChanged).toBe(1);
    expect(body.data.results).toHaveLength(2);
    expect(body.data.completedAt).toBeDefined();
  });

  it('handles null badge_external from DB', async () => {
    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: [{ id: 'srv-1', version: '1.0.0', badge_external: null }] }),
      }),
    });
    const app = await createApp(env, adminUser);

    await app.request('/api/admin/rescan', { method: 'POST' }, env);

    expect(mockRescanAll).toHaveBeenCalledWith([
      { serverId: 'srv-1', version: '1.0.0', dependencies: {}, currentBadgeExternal: 'unverified' },
    ]);
  });

  it('admin user can trigger rescan successfully', async () => {
    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: [{ id: 'srv-1', version: '1.0.0', badge_external: 'partial' }] }),
      }),
    });
    const app = await createApp(env, adminUser);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
  });

  it('summary includes totalScanned and totalChanged', async () => {
    mockRescanAll.mockResolvedValue({
      totalScanned: 3,
      totalChanged: 2,
      results: [],
      completedAt: new Date().toISOString(),
    });

    const env = createMockEnv({
      DB: createMockDB({ allFn: () => ({ results: [] }) }),
    });
    const app = await createApp(env, adminUser);

    const res = await app.request('/api/admin/rescan', { method: 'POST' }, env);
    const body = await res.json() as any;
    expect(body.data.totalScanned).toBe(3);
    expect(body.data.totalChanged).toBe(2);
  });
});
