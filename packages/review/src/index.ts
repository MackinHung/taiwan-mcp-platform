import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { runReviewPipeline } from './pipeline.js';
import type { PipelineInput } from './pipeline.js';

interface Env {
  // Future: D1 binding, etc.
}

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

app.post('/review', async (c) => {
  const input = await c.req.json<PipelineInput>();
  const result = await runReviewPipeline(input);
  return c.json({ success: true, data: result });
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'review-pipeline' }));

export default app;

// Re-export for library usage
export { runReviewPipeline } from './pipeline.js';
export { runScanner } from './scanner.js';
export { calculateAllBadges, calculateExternalBadge } from './badge.js';
export { createReviewReport } from './report.js';
export { runSandbox } from './sandbox.js';
export { runExternalScan, scanOsv, scanDepsDev } from './external-scan.js';
