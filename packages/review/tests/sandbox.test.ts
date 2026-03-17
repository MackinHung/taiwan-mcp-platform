import { describe, it, expect } from 'vitest';
import { runSandbox } from '../src/sandbox.js';

describe('runSandbox (Layer 2 - stub)', () => {
  it('returns sandbox_passed for now (mock implementation)', async () => {
    const result = await runSandbox({ serverId: 'test-1', sourceCode: 'const x = 1;' });
    expect(result.status).toBe('sandbox_passed');
    expect(result.details).toContain('stub');
  });

  it('returns correct shape', async () => {
    const result = await runSandbox({ serverId: 'test-2', sourceCode: '' });
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('durationMs');
    expect(typeof result.durationMs).toBe('number');
  });

  it('can be queued for later execution', async () => {
    const result = await runSandbox({ serverId: 'test-3', sourceCode: 'eval("x");' });
    expect(result.status).toBe('sandbox_passed');
    // Stub always passes - real implementation would sandbox-execute
  });

  it('returns expected structure with all fields', async () => {
    const result = await runSandbox({ serverId: 'test-4', sourceCode: 'console.log("hi");' });
    expect(typeof result.status).toBe('string');
    expect(typeof result.details).toBe('string');
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('indicates sandbox not yet implemented', async () => {
    const result = await runSandbox({ serverId: 'test-5', sourceCode: '' });
    expect(result.details.toLowerCase()).toContain('stub');
  });
});
