import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

const PLAN_LIMITS: Record<string, { monthly_calls: number; calls_per_minute: number }> = {
  free: { monthly_calls: 10_000, calls_per_minute: 50 },
  developer: { monthly_calls: 100_000, calls_per_minute: 200 },
  team: { monthly_calls: 500_000, calls_per_minute: 500 },
  enterprise: { monthly_calls: -1, calls_per_minute: 2_000 },
};

export function rateLimitMiddleware() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      await next();
      return;
    }

    const env = c.env;
    const plan = user.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Per-minute rate check
    const currentMinute = Math.floor(Date.now() / 60000);
    const rlKey = `rl:${user.id}:${currentMinute}`;
    const currentCount = parseInt(await env.RATE_LIMITS.get(rlKey) || '0', 10);

    if (currentCount >= limits.calls_per_minute) {
      const secondsUntilReset = 60 - (Math.floor(Date.now() / 1000) % 60);
      return c.json(
        { success: false, error: '請求過於頻繁，請稍後再試', data: null },
        { status: 429, headers: { 'Retry-After': String(secondsUntilReset) } },
      );
    }

    // Monthly usage check (skip for enterprise unlimited)
    if (limits.monthly_calls !== -1) {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const row = await env.DB.prepare(
        'SELECT COALESCE(SUM(call_count), 0) as total FROM usage_daily WHERE user_id = ? AND date >= ?'
      ).bind(user.id, monthStart).first<{ total: number }>();

      const monthlyTotal = row?.total ?? 0;
      if (monthlyTotal > limits.monthly_calls) {
        return c.json(
          { success: false, error: '已達用量上限，請升級方案', data: null },
          { status: 402 },
        );
      }
    }

    // Increment per-minute counter
    await env.RATE_LIMITS.put(rlKey, String(currentCount + 1), { expirationTtl: 120 });

    await next();
  });
}
