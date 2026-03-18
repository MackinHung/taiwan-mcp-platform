/**
 * Permission Violation Logger
 * Logs permission violations for monitoring/auditing.
 */
import type { PermissionViolation } from './permission-checker.js';

export interface PermissionLogEntry {
  timestamp: string;
  violation: PermissionViolation;
  compositionId: string;
  userId: string;
}

/**
 * Log a permission violation. Non-blocking, fire-and-forget.
 * In production, this would write to D1 or analytics.
 * Currently logs to console for monitoring.
 */
export function logPermissionViolation(
  violation: PermissionViolation,
  compositionId: string,
  userId: string
): PermissionLogEntry {
  const entry: PermissionLogEntry = {
    timestamp: new Date().toISOString(),
    violation,
    compositionId,
    userId,
  };

  console.warn(
    `[PERMISSION] ${violation.type} | server=${violation.serverId} tool=${violation.toolName} | ${violation.evidence}`
  );

  return entry;
}

/**
 * Log multiple violations.
 */
export function logPermissionViolations(
  violations: PermissionViolation[],
  compositionId: string,
  userId: string
): PermissionLogEntry[] {
  return violations.map(v => logPermissionViolation(v, compositionId, userId));
}
