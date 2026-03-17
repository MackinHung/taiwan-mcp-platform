import { evalDetect } from '../rules/eval-detect.js';
import { networkCheck } from '../rules/network-check.js';
import { envLeak } from '../rules/env-leak.js';
import { promptInjection } from '../rules/prompt-injection.js';
import { cveCheck } from '../rules/cve-check.js';

export interface ScanInput {
  sourceCode: string;
  toolDescriptions: string[];
  declaredExternalUrls: string[];
  dependencies: Record<string, string>;
}

export interface ScanRuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

export interface ScanOutput {
  status: 'scan_passed' | 'scan_failed';
  hasWarnings: boolean;
  results: ScanRuleResult[];
  externalUrlsDetected: string[];
  durationMs: number;
}

export function runScanner(input: ScanInput): ScanOutput {
  const start = Date.now();
  const results: ScanRuleResult[] = [];

  // Rule 1: eval/exec detection
  results.push(evalDetect(input.sourceCode));

  // Rule 2: network URL check
  const netResult = networkCheck(input.sourceCode, input.declaredExternalUrls);
  results.push({
    ruleName: netResult.ruleName,
    pass: netResult.pass,
    severity: netResult.severity,
    details: netResult.details,
  });

  // Rule 3: env leak detection
  results.push(envLeak(input.sourceCode));

  // Rule 4: prompt injection detection (scan all tool descriptions)
  const allDescriptions = input.toolDescriptions.join('\n');
  results.push(promptInjection(allDescriptions));

  // Rule 5: CVE check (stub)
  results.push(cveCheck(input.dependencies));

  // Aggregate
  const hasFail = results.some((r) => !r.pass && r.severity === 'fail');
  const hasWarnings = results.some((r) => r.severity === 'warn' && !r.pass);

  // Include both full URLs and their origins for matching
  const origins = new Set<string>();
  for (const url of netResult.detectedUrls) {
    origins.add(url);
    try {
      origins.add(new URL(url).origin);
    } catch {
      // non-parseable URL, keep as-is
    }
  }

  return {
    status: hasFail ? 'scan_failed' : 'scan_passed',
    hasWarnings,
    results,
    externalUrlsDetected: [...origins],
    durationMs: Date.now() - start,
  };
}
