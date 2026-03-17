import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { serverRoutes } from './routes/servers.js';
import { compositionRoutes } from './routes/compositions.js';
import { uploadRoutes } from './routes/upload.js';
import { adminRoutes } from './routes/admin.js';
import { keyRoutes } from './routes/keys.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { usageMiddleware } from './middleware/usage.js';

const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

// CORS
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// Auth middleware (sets c.var.user if authenticated, but doesn't block)
app.use('/api/*', authMiddleware());

// Rate limiting
app.use('/api/*', rateLimitMiddleware());

// Usage metering
app.use('/api/*', usageMiddleware());

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/servers', serverRoutes);
app.route('/api/compositions', compositionRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/keys', keyRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
