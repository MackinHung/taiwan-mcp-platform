import { describe, it, expect } from 'vitest';
import { runSandbox } from '../src/sandbox/index.js';

describe('runSandbox (Layer 2 - behavioral sandbox)', () => {
  it('returns sandbox_passed for clean code', async () => {
    const result = await runSandbox({ serverId: 'test-1', sourceCode: 'const x = 1;' });
    expect(result.status).toBe('sandbox_passed');
  });

  it('returns correct shape', async () => {
    const result = await runSandbox({ serverId: 'test-2', sourceCode: '' });
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('durationMs');
    expect(typeof result.durationMs).toBe('number');
  });

  it('detects eval as violation for readonly permission', async () => {
    const result = await runSandbox({ serverId: 'test-3', sourceCode: 'eval("x");', declaredPermissions: 'readonly' });
    expect(result.status).toBe('sandbox_failed');
    expect(result.violations).toBeDefined();
    expect(result.violations!.length).toBeGreaterThan(0);
  });

  it('returns expected structure with all fields', async () => {
    const result = await runSandbox({ serverId: 'test-4', sourceCode: 'console.log("hi");' });
    expect(typeof result.status).toBe('string');
    expect(typeof result.details).toBe('string');
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.behaviorTrace).toBeDefined();
  });

  it('includes behaviorTrace in result', async () => {
    const result = await runSandbox({ serverId: 'test-5', sourceCode: '' });
    expect(result.behaviorTrace).toBeDefined();
    expect(result.behaviorTrace!.networkCalls).toEqual([]);
    expect(result.behaviorTrace!.envAccess).toEqual([]);
  });
});
