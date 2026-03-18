import { analyzeTrace } from './trace-analyzer.js';
import { checkViolations } from './violation-checker.js';
import type { SandboxInput, SandboxResult } from './types.js';

export type { BehaviorTrace, SandboxViolation, SandboxResult, SandboxInput } from './types.js';

export async function runSandbox(input: SandboxInput): Promise<SandboxResult> {
  const start = Date.now();

  const behaviorTrace = analyzeTrace(input.sourceCode);
  const violations = checkViolations(
    behaviorTrace,
    input.declaredExternalUrls ?? [],
    input.declaredPermissions ?? 'readonly'
  );

  const hasFailViolations = violations.some((v) => v.severity === 'fail');
  const durationMs = Date.now() - start;

  return {
    status: hasFailViolations ? 'sandbox_failed' : 'sandbox_passed',
    details: hasFailViolations
      ? `Sandbox found ${violations.length} violation(s): ${violations.map((v) => v.type).join(', ')}`
      : `Sandbox passed: ${Object.values(behaviorTrace).flat().length} behaviors analyzed`,
    durationMs,
    behaviorTrace,
    violations,
  };
}
