import { describe, it, expect } from 'vitest';
import { obfuscationDetect } from '../../rules/obfuscation-detect.js';

describe('obfuscationDetect rule', () => {
  it('passes clean readable code', () => {
    const result = obfuscationDetect('const name = "hello";\nfunction greet(user) {\n  return `Hi ${user}`;\n}');
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('passes empty code', () => {
    const result = obfuscationDetect('');
    expect(result.pass).toBe(true);
  });

  it('detects hex-escaped strings', () => {
    const result = obfuscationDetect('const a = "\\x68\\x65\\x6c\\x6c\\x6f\\x77\\x6f\\x72\\x6c\\x64";');
    expect(result.pass).toBe(false);
    expect(result.details).toContain('hex');
  });

  it('detects long base64 blobs', () => {
    const b64 = 'A'.repeat(200);
    const result = obfuscationDetect(`const payload = "${b64}";`);
    expect(result.pass).toBe(false);
    expect(result.details).toContain('base64');
  });

  it('does not flag short base64-like strings', () => {
    const result = obfuscationDetect('const id = "dGVzdA==";');
    expect(result.pass).toBe(true);
  });

  it('detects String.fromCharCode obfuscation', () => {
    const result = obfuscationDetect('const s = String.fromCharCode(104,101,108,108,111);');
    expect(result.pass).toBe(false);
    expect(result.details).toContain('fromCharCode');
  });

  it('detects atob decoding pattern', () => {
    const result = obfuscationDetect('const decoded = atob("aGVsbG8gd29ybGQ=");');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('detects extremely long single lines (minification)', () => {
    const longLine = 'var a=1;'.repeat(200);
    const result = obfuscationDetect(longLine);
    expect(result.pass).toBe(false);
    expect(result.details).toContain('minif');
  });

  it('detects excessive single-char variable names', () => {
    // Many single-char assignments suggest obfuscation
    const code = Array.from({ length: 15 }, (_, i) =>
      `var ${String.fromCharCode(97 + (i % 26))}${i} = ${i};`
    ).join('\n');
    // This has var names like a0, b1, c2 — not single-char. Let's make real single-char:
    const obfCode = 'var a=1;var b=2;var c=3;var d=4;var e=5;var f=6;var g=7;var h=8;var i=9;var j=10;var k=11;';
    const result = obfuscationDetect(obfCode);
    expect(result.pass).toBe(false);
    expect(result.details).toContain('variable');
  });

  it('passes normal code with a few short variable names', () => {
    const result = obfuscationDetect('const i = 0;\nfor (let j = 0; j < 10; j++) {\n  console.log(j);\n}');
    expect(result.pass).toBe(true);
  });

  it('detects unicode escape sequences', () => {
    const result = obfuscationDetect('const x = "\\u0068\\u0065\\u006c\\u006c\\u006f\\u0077\\u006f\\u0072\\u006c\\u0064";');
    expect(result.pass).toBe(false);
    expect(result.details).toContain('unicode');
  });
});
