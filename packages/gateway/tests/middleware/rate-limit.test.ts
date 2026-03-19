import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser } from '../helpers.js';

describe('Rate Limit Middleware', () => {
  let app: Hono<{ Bindings: Env; Variables: { user: any; session: any } }>;

  function setupApp(env: Env, user: any = null) {
    // We import dynamically to get fresh modules
    return import('../../src/middleware/rate-limit.js').then(({ rateLimitMiddleware }) => {
      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

      // Simulate auth setting user
      app.use('*', async (c, next) => {
        if (user) c.set('user', user);
        await next();
      });

      app.use('*', rateLimitMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));
      return app;
    });
  }

  describe('Per-minute rate limiting', () => {
    it('should allow requests under limit', async () => {
      const user = createMockUser({ plan: 'free' });
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });

    it('should block requests over per-minute limit for free plan', async () => {
      const user = createMockUser({ plan: 'free' });
      // Simulate 50 existing requests
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '50';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('should allow requests at limit - 1 for free plan', async () => {
      const user = createMockUser({ plan: 'free' });
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '49';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });

    it('should use developer plan limits (200/min)', async () => {
      const user = createMockUser({ plan: 'developer' });
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '199';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });

    it('should block developer at limit (200/min)', async () => {
      const user = createMockUser({ plan: 'developer' });
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '200';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(429);
    });

    it('should use team plan limits (500/min)', async () => {
      const user = createMockUser({ plan: 'team' });
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '499';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });

    it('should use enterprise plan limits (2000/min)', async () => {
      const user = createMockUser({ plan: 'enterprise' });
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '1999';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });
  });

  describe('Monthly usage limiting', () => {
    it('should block when monthly usage exceeded', async () => {
      const user = createMockUser({ plan: 'free' });
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({
        RATE_LIMITS: createMockKV(kvStore),
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('SUM') || query.includes('sum')) {
              return { total: 10001 };
            }
            return null;
          },
        }),
      });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('should allow when monthly usage under limit', async () => {
      const user = createMockUser({ plan: 'free' });
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({
        RATE_LIMITS: createMockKV(kvStore),
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('SUM') || query.includes('sum')) {
              return { total: 5000 };
            }
            return null;
          },
        }),
      });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });

    it('should allow enterprise unlimited monthly', async () => {
      const user = createMockUser({ plan: 'enterprise' });
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({
        RATE_LIMITS: createMockKV(kvStore),
        DB: createMockDB({
          firstFn: (query) => {
            if (query.includes('SUM') || query.includes('sum')) {
              return { total: 999999 };
            }
            return null;
          },
        }),
      });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });
  });

  describe('Unauthenticated requests', () => {
    it('should skip rate limiting for unauthenticated requests', async () => {
      const kvStore: Record<string, string> = {};
      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, null);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(200);
    });
  });

  describe('429 response format', () => {
    it('should include retry-after header', async () => {
      const user = createMockUser({ plan: 'free' });
      const kvStore: Record<string, string> = {};
      const currentMinute = Math.floor(Date.now() / 60000);
      kvStore[`rl:user-123:${currentMinute}`] = '50';

      const env = createMockEnv({ RATE_LIMITS: createMockKV(kvStore) });
      const app = await setupApp(env, user);

      const res = await app.request('/test', {}, env);
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeTruthy();
    });
  });
});
