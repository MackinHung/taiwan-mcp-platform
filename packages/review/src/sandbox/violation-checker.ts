import type { BehaviorTrace, SandboxViolation } from './types.js';

const SENSITIVE_KEY_PATTERNS = [
  /SECRET/i,
  /KEY/i,
  /TOKEN/i,
  /PASSWORD/i,
  /CREDENTIAL/i,
];

function extractOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

function buildDeclaredOrigins(declaredUrls: string[]): Set<string> {
  const origins = new Set<string>();
  for (const url of declaredUrls) {
    const origin = extractOrigin(url);
    if (origin !== null) {
      origins.add(origin);
    }
  }
  return origins;
}

function checkUndeclaredUrls(
  networkCalls: BehaviorTrace['networkCalls'],
  declaredOrigins: Set<string>
): SandboxViolation[] {
  const violations: SandboxViolation[] = [];
  for (const call of networkCalls) {
    const origin = extractOrigin(call.url);
    if (origin !== null && !declaredOrigins.has(origin)) {
      violations.push({
        type: 'undeclared_url',
        evidence: `Undeclared network call to ${call.url} (${call.method}) at line ${call.line}`,
        severity: 'fail',
      });
    }
  }
  return violations;
}

function checkSensitiveEnvKeys(envAccess: string[]): SandboxViolation[] {
  const violations: SandboxViolation[] = [];
  for (const key of envAccess) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));
    if (isSensitive) {
      violations.push({
        type: 'undeclared_env',
        evidence: `Access to sensitive env variable: ${key}`,
        severity: 'warn',
      });
    }
  }
  return violations;
}

function checkPermissionExceeded(
  trace: BehaviorTrace,
  declaredPermissions: string
): SandboxViolation[] {
  const violations: SandboxViolation[] = [];

  if (declaredPermissions === 'readonly') {
    const writeOrDelete = trace.fsOperations.filter(
      (op) => op.operation === 'write' || op.operation === 'delete'
    );
    for (const op of writeOrDelete) {
      violations.push({
        type: 'permission_exceeded',
        evidence: `FS ${op.operation} on "${op.path}" at line ${op.line} exceeds readonly permission`,
        severity: 'fail',
      });
    }
    for (const cmd of trace.processSpawns) {
      violations.push({
        type: 'permission_exceeded',
        evidence: `Process spawn "${cmd}" exceeds readonly permission`,
        severity: 'fail',
      });
    }
  }

  if (declaredPermissions === 'readonly' || declaredPermissions === 'limited_write') {
    for (const expr of trace.dynamicEval) {
      violations.push({
        type: 'permission_exceeded',
        evidence: `Dynamic eval "${expr}" exceeds ${declaredPermissions} permission`,
        severity: 'fail',
      });
    }
  }

  return violations;
}

export function checkViolations(
  trace: BehaviorTrace,
  declaredUrls: string[],
  declaredPermissions: string
): SandboxViolation[] {
  const declaredOrigins = buildDeclaredOrigins(declaredUrls);

  return [
    ...checkUndeclaredUrls(trace.networkCalls, declaredOrigins),
    ...checkSensitiveEnvKeys(trace.envAccess),
    ...checkPermissionExceeded(trace, declaredPermissions),
  ];
}
