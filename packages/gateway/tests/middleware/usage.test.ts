import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser } from '../helpers.js';

describe('Usage Middleware', () => {
  function setupApp(env: Env, user: any = null) {
    return import('../../src/middleware/usage.js').then(({ usageMiddleware }) => {
      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

      app.use('*', async (c, next) => {
        if (user) c.set('user', user);
        await next();
      });

      app.use('*', usageMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));
      app.get('/error', (c) => {
        c.status(500);
        return c.json({ error: 'fail' });
      });
      return app;
    });
  }

  it('should record usage for authenticated user', async () => {
    const user = createMockUser();
    let ranQuery = false;
    const env = createMockEnv({
      DB: createMockDB({
        runFn: (query) => {
          if (query.includes('usage_daily')) ranQuery = true;
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });
    const app = await setupApp(env, user);

    const res = await app.request('/test', {}, env);
    expect(res.status).toBe(200);
    expect(ranQuery).toBe(true);
  });

  it('should skip recording for unauthenticated requests', async () => {
    let ranQuery = false;
    const env = createMockEnv({
      DB: createMockDB({
        runFn: (query) => {
          if (query.includes('usage_daily')) ranQuery = true;
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });
    const app = await setupApp(env, null);

    const res = await app.request('/test', {}, env);
    expect(res.status).toBe(200);
    expect(ranQuery).toBe(false);
  });

  it('should record error count when response is error', async () => {
    const user = createMockUser();
    let recordedQuery = '';
    const env = createMockEnv({
      DB: createMockDB({
        runFn: (query) => {
          if (query.includes('usage_daily')) recordedQuery = query;
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });
    const app = await setupApp(env, user);

    const res = await app.request('/error', {}, env);
    expect(res.status).toBe(500);
    expect(recordedQuery).toContain('error_count');
  });

  it('should handle DB errors gracefully without crashing', async () => {
    const user = createMockUser();
    const env = createMockEnv({
      DB: createMockDB({
        runFn: () => { throw new Error('DB write failed'); },
      }),
    });
    const app = await setupApp(env, user);

    const res = await app.request('/test', {}, env);
    // Should still return 200 - usage recording failure shouldn't break the request
    expect(res.status).toBe(200);
  });

  it('should include latency in recording', async () => {
    const user = createMockUser();
    let recordedQuery = '';
    const env = createMockEnv({
      DB: createMockDB({
        runFn: (query) => {
          if (query.includes('usage_daily')) recordedQuery = query;
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });
    const app = await setupApp(env, user);

    await app.request('/test', {}, env);
    expect(recordedQuery).toContain('total_latency_ms');
  });
});
