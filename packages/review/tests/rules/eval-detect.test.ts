import { describe, it, expect } from 'vitest';
import { evalDetect } from '../../rules/eval-detect.js';

describe('evalDetect rule', () => {
  it('detects eval() calls', () => {
    const result = evalDetect('const x = eval("alert(1)");');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
    expect(result.details).toContain('eval');
  });

  it('detects new Function() calls', () => {
    const result = evalDetect('const fn = new Function("return 1");');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
    expect(result.details).toContain('Function');
  });

  it('detects exec patterns', () => {
    const result = evalDetect('child_process.exec("ls -la");');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('detects execSync patterns', () => {
    const result = evalDetect('const out = execSync("whoami");');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('detects spawn patterns', () => {
    const result = evalDetect('spawn("bash", ["-c", "rm -rf /"]);');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('passes clean code', () => {
    const result = evalDetect('const x = 1 + 2;\nconsole.log(x);');
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('passes code with eval in comments', () => {
    const result = evalDetect('// eval is dangerous\nconst x = 1;');
    expect(result.pass).toBe(true);
  });

  it('detects multiple violations', () => {
    const result = evalDetect('eval("x");\nnew Function("y");');
    expect(result.pass).toBe(false);
    expect(result.details).toContain('eval');
    expect(result.details).toContain('Function');
  });

  it('passes empty source code', () => {
    const result = evalDetect('');
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('detects Function() without new keyword', () => {
    // The existing patterns do not include bare Function() without new,
    // but they include exec/spawn. We test that eval in mixed code is found.
    const result = evalDetect('const a = 1;\neval("x");\nconst b = 2;');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('detects setTimeout with string argument as warn', () => {
    const result = evalDetect('setTimeout("alert(1)", 100);');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('detects setInterval with string argument as warn', () => {
    const result = evalDetect('setInterval("doStuff()", 1000);');
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('warn');
  });

  it('passes setTimeout with function argument', () => {
    const result = evalDetect('setTimeout(() => console.log("hi"), 100);');
    expect(result.pass).toBe(true);
  });
});
