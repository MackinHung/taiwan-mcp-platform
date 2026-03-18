import { describe, it, expect, vi } from 'vitest';
import { logPermissionViolation, logPermissionViolations } from '../src/permission-logger.js';
import type { PermissionViolation } from '../src/permission-checker.js';

describe('logPermissionViolation', () => {
  const violation: PermissionViolation = {
    type: 'write_on_readonly',
    toolName: 'create_record',
    serverId: 'srv-1',
    evidence: 'Tool name "create_record" indicates write operation on readonly server',
    severity: 'warn',
  };

  it('returns PermissionLogEntry', () => {
    const entry = logPermissionViolation(violation, 'comp-1', 'user-1');
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('violation');
    expect(entry).toHaveProperty('compositionId');
    expect(entry).toHaveProperty('userId');
  });

  it('includes timestamp', () => {
    const before = new Date().toISOString();
    const entry = logPermissionViolation(violation, 'comp-1', 'user-1');
    const after = new Date().toISOString();
    expect(entry.timestamp >= before).toBe(true);
    expect(entry.timestamp <= after).toBe(true);
  });

  it('includes compositionId and userId', () => {
    const entry = logPermissionViolation(violation, 'comp-42', 'user-99');
    expect(entry.compositionId).toBe('comp-42');
    expect(entry.userId).toBe('user-99');
  });
});

describe('logPermissionViolations', () => {
  it('returns array of entries', () => {
    const violations: PermissionViolation[] = [
      {
        type: 'write_on_readonly',
        toolName: 'create_record',
        serverId: 'srv-1',
        evidence: 'write on readonly',
        severity: 'warn',
      },
      {
        type: 'undeclared_url_in_args',
        toolName: 'get_data',
        serverId: 'srv-1',
        evidence: 'undeclared URL',
        severity: 'info',
      },
    ];
    const entries = logPermissionViolations(violations, 'comp-1', 'user-1');
    expect(entries).toHaveLength(2);
    expect(entries[0].violation.type).toBe('write_on_readonly');
    expect(entries[1].violation.type).toBe('undeclared_url_in_args');
  });

  it('handles empty array', () => {
    const entries = logPermissionViolations([], 'comp-1', 'user-1');
    expect(entries).toHaveLength(0);
  });
});
