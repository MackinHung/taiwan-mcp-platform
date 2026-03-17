import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export function securityHeaders() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // HSTS is handled by Cloudflare edge automatically
  });
}
