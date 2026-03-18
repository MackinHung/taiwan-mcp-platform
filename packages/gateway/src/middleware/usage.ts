import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';
import { defer } from '../lib/defer.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export function usageMiddleware() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const start = Date.now();

    await next();

    const user = c.get('user');
    if (!user) return;

    // Non-blocking — usage recording shouldn't delay the response
    const usageWork = async () => {
      const latency = Date.now() - start;
      const isError = c.res.status >= 400 ? 1 : 0;
      const today = new Date().toISOString().slice(0, 10);

      try {
        await c.env.DB.prepare(
          `INSERT INTO usage_daily (id, user_id, date, call_count, error_count, total_latency_ms)
           VALUES (?, ?, ?, 1, ?, ?)
           ON CONFLICT(user_id, date) DO UPDATE SET
             call_count = call_count + 1,
             error_count = error_count + ?,
             total_latency_ms = total_latency_ms + ?`
        ).bind(
          crypto.randomUUID(), user.id, today, isError, latency, isError, latency,
        ).run();
      } catch {
        // Usage recording failure should not break the request
      }
    };

    defer(c, usageWork());
  });
}
