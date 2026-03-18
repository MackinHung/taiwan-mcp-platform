import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export interface AnomalyEvent {
  readonly type: 'rate_exceeded' | 'geo_change' | 'auth_failed';
  readonly api_key_hash: string;
  readonly ip: string;
  readonly country: string;
  readonly timestamp: string;
  readonly details: string;
}

// Thresholds
const RATE_THRESHOLD = 100;          // > 100 requests per 5 minutes
const RATE_WINDOW_MINUTES = 5;
const AUTH_FAIL_THRESHOLD = 20;      // > 20 auth failures per 10 minutes
const AUTH_FAIL_WINDOW_MINUTES = 10;

/**
 * Get the KV key for today's anomaly log.
 */
export function getAnomalyKey(date?: Date): string {
  const d = date ?? new Date();
  const dateStr = d.toISOString().slice(0, 10);
  return `anomaly:${dateStr}`;
}

/**
 * Build a rate-tracking KV key for anomaly detection.
 */
export function getRateKey(ip: string, windowMinute: number): string {
  return `anomaly-rate:${ip}:${windowMinute}`;
}

/**
 * Build an auth-failure tracking KV key.
 */
export function getAuthFailKey(ip: string, windowMinute: number): string {
  return `anomaly-auth:${ip}:${windowMinute}`;
}

/**
 * Append an anomaly event to the daily KV log.
 */
async function logAnomaly(kv: KVNamespace, event: AnomalyEvent): Promise<void> {
  const key = getAnomalyKey();
  const existing = await kv.get(key);
  const events: AnomalyEvent[] = existing ? JSON.parse(existing) : [];
  const updated = [...events, event];
  // Keep daily log for 7 days
  await kv.put(key, JSON.stringify(updated), { expirationTtl: 604800 });
}

/**
 * Anomaly detection middleware.
 * Detects three types of anomalies:
 * 1. rate_exceeded — single IP > 100 requests in 5 minutes
 * 2. auth_failed — single IP > 20 auth failures in 10 minutes
 * 3. geo_change — same session from different country within 30 minutes
 */
export function anomalyMiddleware() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const country = c.req.header('cf-ipcountry') || 'unknown';
    const env = c.env;

    // Track request rate per IP (5-minute window)
    const currentWindow = Math.floor(Date.now() / (RATE_WINDOW_MINUTES * 60000));
    const rateKey = getRateKey(ip, currentWindow);
    const rateCount = parseInt(await env.RATE_LIMITS.get(rateKey) || '0', 10);

    if (rateCount >= RATE_THRESHOLD) {
      await logAnomaly(env.RATE_LIMITS, {
        type: 'rate_exceeded',
        api_key_hash: '',
        ip,
        country,
        timestamp: new Date().toISOString(),
        details: `${rateCount + 1} requests in ${RATE_WINDOW_MINUTES} minutes`,
      });
    }

    await env.RATE_LIMITS.put(rateKey, String(rateCount + 1), {
      expirationTtl: RATE_WINDOW_MINUTES * 60 * 2,
    });

    await next();

    // Check for auth failures (401/403 responses)
    if (c.res.status === 401 || c.res.status === 403) {
      const authWindow = Math.floor(Date.now() / (AUTH_FAIL_WINDOW_MINUTES * 60000));
      const authKey = getAuthFailKey(ip, authWindow);
      const failCount = parseInt(await env.RATE_LIMITS.get(authKey) || '0', 10);

      await env.RATE_LIMITS.put(authKey, String(failCount + 1), {
        expirationTtl: AUTH_FAIL_WINDOW_MINUTES * 60 * 2,
      });

      if (failCount + 1 >= AUTH_FAIL_THRESHOLD) {
        await logAnomaly(env.RATE_LIMITS, {
          type: 'auth_failed',
          api_key_hash: '',
          ip,
          country,
          timestamp: new Date().toISOString(),
          details: `${failCount + 1} auth failures in ${AUTH_FAIL_WINDOW_MINUTES} minutes`,
        });
      }
    }

    // Geo-change detection for authenticated sessions
    const user = c.get('user');
    if (user && country !== 'unknown') {
      const geoKey = `anomaly-geo:${user.id}`;
      const lastGeo = await env.RATE_LIMITS.get(geoKey);

      if (lastGeo && lastGeo !== country) {
        await logAnomaly(env.RATE_LIMITS, {
          type: 'geo_change',
          api_key_hash: '',
          ip,
          country,
          timestamp: new Date().toISOString(),
          details: `Country changed from ${lastGeo} to ${country}`,
        });
      }

      // Store current country with 30-minute TTL
      await env.RATE_LIMITS.put(geoKey, country, { expirationTtl: 1800 });
    }
  });
}
