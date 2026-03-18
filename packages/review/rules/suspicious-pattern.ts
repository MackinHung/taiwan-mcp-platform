export interface RuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

interface PatternDef {
  test: (code: string) => boolean;
  label: string;
  severity: 'warn' | 'fail';
}

/**
 * FAIL-level patterns: strong indicators of malicious intent
 */
const FAIL_PATTERNS: PatternDef[] = [
  {
    // Reverse shell: net + child_process + spawn("/bin/sh")
    test: (code) =>
      /require\s*\(\s*["'`](?:net|child_process)["'`]\s*\)/.test(code) &&
      /spawn\s*\(\s*["'`](?:\/bin\/(?:sh|bash)|cmd|powershell)["'`]/.test(code),
    label: 'reverse shell pattern',
    severity: 'fail',
  },
  {
    // Crypto mining keywords
    test: (code) => /\b(?:CoinHive|coinhive|cryptonight|stratum\+tcp|minergate|xmrig)\b/i.test(code),
    label: 'crypto mining indicator',
    severity: 'fail',
  },
  {
    // Shell command download + execute: curl/wget piped to sh/bash
    test: (code) => /(?:curl|wget)\s+[^\n]*\|\s*(?:sh|bash|node|python)/.test(code),
    label: 'remote code download and execution',
    severity: 'fail',
  },
];

/**
 * WARN-level patterns: suspicious behaviors that merit review
 */
const WARN_PATTERNS: PatternDef[] = [
  {
    // base64 decode + network call in same file
    test: (code) =>
      (/\batob\s*\(/.test(code) || /Buffer\.from\s*\([^)]*["'`]base64["'`]/.test(code)) &&
      /\b(?:fetch|axios|request|http\.request|XMLHttpRequest)\s*\(/.test(code),
    label: 'base64 decode combined with network request',
    severity: 'warn',
  },
  {
    // Prototype pollution
    test: (code) => /\b__proto__\b/.test(code) || /\bconstructor\.constructor\b/.test(code),
    label: 'prototype pollution pattern',
    severity: 'warn',
  },
  {
    // Dynamic require: variable arg, string concatenation, or template literal
    test: (code) => /require\s*\(\s*[a-zA-Z_$][\w$]*\s*\+/.test(code) ||
      /require\s*\(\s*["'`][^"'`]*["'`]\s*\+/.test(code) ||
      // require(variable) where a dangerous module name is built nearby
      (/["'`]child_["'`]\s*\+\s*["'`]process["'`]/.test(code) && /require\s*\(/.test(code)),
    label: 'dynamic require with concatenation',
    severity: 'warn',
  },
  {
    // WebSocket + process.env (data exfiltration via WebSocket)
    test: (code) =>
      /new\s+WebSocket\s*\(/.test(code) && /process\.env/.test(code),
    label: 'WebSocket combined with env access',
    severity: 'warn',
  },
  {
    // DNS exfiltration pattern
    test: (code) => /dns\.resolve|dns\.lookup/.test(code) && /process\.env/.test(code),
    label: 'DNS combined with env access (possible exfiltration)',
    severity: 'warn',
  },
];

export function suspiciousPattern(sourceCode: string): RuleResult {
  if (!sourceCode) {
    return { ruleName: 'suspicious-pattern', pass: true, severity: 'info', details: 'No source code to analyze' };
  }

  const failFindings: string[] = [];
  const warnFindings: string[] = [];

  for (const p of FAIL_PATTERNS) {
    if (p.test(sourceCode)) {
      failFindings.push(p.label);
    }
  }

  for (const p of WARN_PATTERNS) {
    if (p.test(sourceCode)) {
      warnFindings.push(p.label);
    }
  }

  if (failFindings.length > 0) {
    const allFindings = [...failFindings, ...warnFindings];
    return {
      ruleName: 'suspicious-pattern',
      pass: false,
      severity: 'fail',
      details: `Malicious patterns detected: ${allFindings.join(', ')}`,
    };
  }

  if (warnFindings.length > 0) {
    return {
      ruleName: 'suspicious-pattern',
      pass: false,
      severity: 'warn',
      details: `Suspicious patterns detected: ${warnFindings.join(', ')}`,
    };
  }

  return {
    ruleName: 'suspicious-pattern',
    pass: true,
    severity: 'info',
    details: 'No suspicious behavioral patterns detected',
  };
}
