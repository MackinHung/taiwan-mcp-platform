import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { serverRoutes } from './routes/servers.js';
import { compositionRoutes } from './routes/compositions.js';
import { uploadRoutes } from './routes/upload.js';
import { adminRoutes } from './routes/admin.js';
import { keyRoutes } from './routes/keys.js';
import { privacyRoutes } from './routes/privacy.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { usageMiddleware } from './middleware/usage.js';
import { securityHeaders } from './middleware/security-headers.js';
import { attributionMiddleware } from './middleware/attribution.js';
import { anomalyMiddleware } from './middleware/anomaly-logger.js';
import { validateEnv } from './lib/validate-env.js';

const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

// Env validation (runs once per isolate via flag)
let envValidated = false;
app.use('*', async (c, next) => {
  if (!envValidated) {
    validateEnv(c.env);
    envValidated = true;
  }
  await next();
});

// CORS — restrict to FRONTEND_URL only
app.use('*', cors({
  origin: (origin, c) => {
    const frontendUrl = c.env.FRONTEND_URL;
    if (!origin) return frontendUrl; // same-origin or server-to-server
    if (origin === frontendUrl) return origin;
    return ''; // reject other origins
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Security headers
app.use('*', securityHeaders());

// Auth middleware (sets c.var.user if authenticated, but doesn't block)
app.use('/api/*', authMiddleware());

// Rate limiting
app.use('/api/*', rateLimitMiddleware());

// Usage metering
app.use('/api/*', usageMiddleware());

// Data attribution headers
app.use('/api/*', attributionMiddleware());

// Anomaly detection
app.use('/api/*', anomalyMiddleware());

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/servers', serverRoutes);
app.route('/api/compositions', compositionRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/keys', keyRoutes);
app.route('/api/privacy', privacyRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
