/**
 * Runtime Monitoring Middleware
 * Detects 3 types of anomalies:
 * 1. tool_abuse — single tool > 50% of all calls (5 min window)
 * 2. error_spike — error rate > 30% with minimum 10 requests (5 min window)
 * 3. new_url_detected — response contains undeclared URLs
 */
import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';
import { defer } from '../lib/defer.js';
import { logAnomaly } from './anomaly-logger.js';
import {
  TOOL_ABUSE_THRESHOLD,
  ERROR_SPIKE_THRESHOLD,
  ERROR_SPIKE_MIN_REQUESTS,
  MONITORING_WINDOW_MINUTES,
  getToolCountKey,
  getTotalCountKey,
  getErrorCountKey,
  getRequestCountKey,
} from './monitoring-types.js';
import { extractUrls, findUndeclaredUrls } from '../lib/url-inspector.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

/**
 * Check for tool abuse: if one tool gets > 50% of all calls in a window.
 */
async function checkToolAbuse(
  kv: KVNamespace,
  serverId: string,
  toolName: string,
  windowMinute: number
): Promise<{ isAbuse: boolean; toolCount: number; totalCount: number }> {
  const toolKey = getToolCountKey(serverId, toolName, windowMinute);
  const totalKey = getTotalCountKey(serverId, windowMinute);

  const [toolCountStr, totalCountStr] = await Promise.all([
    kv.get(toolKey),
    kv.get(totalKey),
  ]);

  const toolCount = parseInt(toolCountStr || '0', 10) + 1;
  const totalCount = parseInt(totalCountStr || '0', 10) + 1;

  const isAbuse = totalCount >= 10 && (toolCount / totalCount) > TOOL_ABUSE_THRESHOLD;

  return { isAbuse, toolCount, totalCount };
}

/**
 * Check for error spike: error rate > 30% with at least 10 requests.
 */
async function checkErrorSpike(
  kv: KVNamespace,
  serverId: string,
  windowMinute: number,
  isError: boolean
): Promise<{ isSpike: boolean; errorCount: number; requestCount: number }> {
  const errorKey = getErrorCountKey(serverId, windowMinute);
  const reqKey = getRequestCountKey(serverId, windowMinute);

  const [errorCountStr, reqCountStr] = await Promise.all([
    kv.get(errorKey),
    kv.get(reqKey),
  ]);

  const errorCount = parseInt(errorCountStr || '0', 10) + (isError ? 1 : 0);
  const requestCount = parseInt(reqCountStr || '0', 10) + 1;

  const isSpike = requestCount >= ERROR_SPIKE_MIN_REQUESTS
    && (errorCount / requestCount) > ERROR_SPIKE_THRESHOLD;

  return { isSpike, errorCount, requestCount };
}

export function monitoringMiddleware() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    // Only monitor POST requests
    if (c.req.method !== 'POST') {
      await next();
      return;
    }

    // Extract server context from URL
    const path = c.req.path;
    const serverIdMatch = path.match(/\/api\/servers\/([^/]+)/);
    const serverId = serverIdMatch?.[1] || 'unknown';

    // Try to extract tool name from request body (best effort, non-blocking)
    let toolName = 'unknown';
    try {
      const clonedReq = c.req.raw.clone();
      const body = await clonedReq.json() as any;
      if (body?.params?.name) {
        toolName = body.params.name;
      } else if (body?.method === 'tools/call' && body?.params?.name) {
        toolName = body.params.name;
      }
    } catch {
      // Can't parse body — skip tool-level monitoring
    }

    await next();

    // Post-response monitoring (all non-blocking via defer)
    const env = c.env;
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const country = c.req.header('cf-ipcountry') || 'unknown';
    const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
    const ttl = MONITORING_WINDOW_MINUTES * 60 * 2;
    const isError = c.res.status >= 400;

    // 1. Tool abuse detection + counter updates
    if (toolName !== 'unknown') {
      const monitorWork = async () => {
        const { isAbuse, toolCount, totalCount } = await checkToolAbuse(
          env.RATE_LIMITS, serverId, toolName, windowMinute
        );

        // Update counters
        const toolKey = getToolCountKey(serverId, toolName, windowMinute);
        const totalKey = getTotalCountKey(serverId, windowMinute);
        await Promise.all([
          env.RATE_LIMITS.put(toolKey, String(toolCount), { expirationTtl: ttl }),
          env.RATE_LIMITS.put(totalKey, String(totalCount), { expirationTtl: ttl }),
        ]);

        if (isAbuse) {
          await logAnomaly(env.RATE_LIMITS, {
            type: 'tool_abuse',
            api_key_hash: '',
            ip,
            country,
            timestamp: new Date().toISOString(),
            details: `Tool "${toolName}" has ${toolCount}/${totalCount} calls (${Math.round(toolCount / totalCount * 100)}%) on server ${serverId}`,
          });
        }
      };
      defer(c, monitorWork());
    }

    // 2. Error spike detection
    const errorWork = async () => {
      const { isSpike, errorCount, requestCount } = await checkErrorSpike(
        env.RATE_LIMITS, serverId, windowMinute, isError
      );

      // Update counters
      const errorKey = getErrorCountKey(serverId, windowMinute);
      const reqKey = getRequestCountKey(serverId, windowMinute);
      await Promise.all([
        env.RATE_LIMITS.put(errorKey, String(errorCount), { expirationTtl: ttl }),
        env.RATE_LIMITS.put(reqKey, String(requestCount), { expirationTtl: ttl }),
      ]);

      if (isSpike) {
        await logAnomaly(env.RATE_LIMITS, {
          type: 'error_spike',
          api_key_hash: '',
          ip,
          country,
          timestamp: new Date().toISOString(),
          details: `Error rate ${Math.round(errorCount / requestCount * 100)}% (${errorCount}/${requestCount}) on server ${serverId}`,
        });
      }
    };
    defer(c, errorWork());

    // 3. New URL detection (only for successful responses with body)
    if (!isError) {
      const urlWork = async () => {
        try {
          const declaredUrlsStr = await env.SERVER_CACHE.get(`declared-urls:${serverId}`);
          if (!declaredUrlsStr) return;

          const declaredUrls = JSON.parse(declaredUrlsStr) as string[];
          const responseClone = c.res.clone();
          const responseBody = await responseClone.text();
          const responseUrls = extractUrls(responseBody);

          if (responseUrls.length === 0) return;

          const undeclared = findUndeclaredUrls(responseUrls, declaredUrls);
          if (undeclared.length > 0) {
            await logAnomaly(env.RATE_LIMITS, {
              type: 'new_url_detected',
              api_key_hash: '',
              ip,
              country,
              timestamp: new Date().toISOString(),
              details: `Undeclared URLs in response from server ${serverId}: ${undeclared.slice(0, 5).join(', ')}`,
            });
          }
        } catch {
          // Response parsing failed — skip URL inspection
        }
      };
      defer(c, urlWork());
    }
  });
}
