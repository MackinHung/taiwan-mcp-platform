/**
 * Defer a promise: use waitUntil in production (non-blocking),
 * silently ignore in test environments where executionCtx throws.
 *
 * Hono's c.executionCtx is a getter that THROWS in non-Workers envs,
 * so optional chaining doesn't help — we need try-catch.
 */
export function defer(c: any, promise: Promise<any>): void {
  try {
    c.executionCtx.waitUntil(promise);
  } catch {
    // Test environment — executionCtx not available.
    // Mock KV/D1 resolve synchronously, so state is already updated.
  }
}
