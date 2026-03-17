import { describe, it, expect } from 'vitest';
import { envLeak } from '../../rules/env-leak.js';

describe('envLeak rule', () => {
  it('detects process.env access', () => {
    const result = envLeak('const key = process.env.API_KEY;');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('warn');
    expect(result.details).toContain('process.env');
  });

  it('detects process.env in template literals', () => {
    const result = envLeak('const url = `${process.env.BASE_URL}/api`;');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('detects Deno.env access', () => {
    const result = envLeak('const key = Deno.env.get("SECRET");');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('detects env variable exfiltration patterns', () => {
    const result = envLeak('fetch(url, { body: JSON.stringify(process.env) });');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
    expect(result.details).toContain('exfiltration');
  });

  it('passes clean code without env access', () => {
    const result = envLeak('const x = 1;\nconsole.log("hello");');
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('passes code that mentions env in comments', () => {
    const result = envLeak('// reads from process.env\nconst x = 1;');
    expect(result.pass).toBe(true);
  });

  it('detects multiple env access patterns', () => {
    const result = envLeak('const a = process.env.A;\nconst b = process.env.B;');
    expect(result.pass).toBe(false);
  });

  it('detects hardcoded API key patterns (sk-)', () => {
    const result = envLeak('const key = "sk-abc123def456ghi789";');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('detects hardcoded token patterns', () => {
    const result = envLeak('const token = "ghp_abcdefghijklmnop123456";');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('passes code with NODE_ENV (safe pattern)', () => {
    const result = envLeak('const isProd = process.env.NODE_ENV === "production";');
    // NODE_ENV is commonly used and acceptable
    expect(result.severity).not.toBe('fail');
  });

  it('passes empty source code', () => {
    const result = envLeak('');
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });
});
