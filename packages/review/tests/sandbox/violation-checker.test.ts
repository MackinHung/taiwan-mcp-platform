import { describe, it, expect } from 'vitest';
import { checkViolations } from '../../src/sandbox/violation-checker.js';
import type { BehaviorTrace } from '../../src/sandbox/types.js';

function emptyTrace(): BehaviorTrace {
  return {
    networkCalls: [],
    envAccess: [],
    fsOperations: [],
    processSpawns: [],
    dynamicEval: [],
  };
}

describe('checkViolations', () => {
  describe('undeclared_url', () => {
    it('flags undeclared network call URLs', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'https://evil.com/steal', method: 'POST', line: 5 }],
      };
      const violations = checkViolations(trace, [], 'readonly');
      expect(violations.some((v) => v.type === 'undeclared_url')).toBe(true);
      expect(violations.find((v) => v.type === 'undeclared_url')!.severity).toBe('fail');
    });

    it('passes when URL origin matches declared URL', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'https://api.example.com/data', method: 'GET', line: 1 }],
      };
      const violations = checkViolations(trace, ['https://api.example.com/other'], 'readonly');
      const urlViolations = violations.filter((v) => v.type === 'undeclared_url');
      expect(urlViolations).toHaveLength(0);
    });

    it('matches by origin not full path', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'https://api.example.com/v2/users', method: 'GET', line: 1 }],
      };
      const violations = checkViolations(trace, ['https://api.example.com/v1/items'], 'readonly');
      const urlViolations = violations.filter((v) => v.type === 'undeclared_url');
      expect(urlViolations).toHaveLength(0);
    });

    it('flags URL with different origin', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'https://other.com/api', method: 'GET', line: 1 }],
      };
      const violations = checkViolations(trace, ['https://api.example.com/'], 'readonly');
      expect(violations.some((v) => v.type === 'undeclared_url')).toBe(true);
    });

    it('handles invalid URLs gracefully', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'not-a-valid-url', method: 'GET', line: 1 }],
      };
      const violations = checkViolations(trace, [], 'readonly');
      // Invalid URLs cannot have their origin extracted, so no undeclared_url violation
      const urlViolations = violations.filter((v) => v.type === 'undeclared_url');
      expect(urlViolations).toHaveLength(0);
    });

    it('flags multiple undeclared URLs', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [
          { url: 'https://evil1.com/a', method: 'GET', line: 1 },
          { url: 'https://evil2.com/b', method: 'POST', line: 2 },
        ],
      };
      const violations = checkViolations(trace, [], 'readonly');
      const urlViolations = violations.filter((v) => v.type === 'undeclared_url');
      expect(urlViolations).toHaveLength(2);
    });
  });

  describe('undeclared_env', () => {
    it('warns on sensitive env keys containing SECRET', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        envAccess: ['MY_SECRET'],
      };
      const violations = checkViolations(trace, [], 'readonly');
      expect(violations.some((v) => v.type === 'undeclared_env')).toBe(true);
      expect(violations.find((v) => v.type === 'undeclared_env')!.severity).toBe('warn');
    });

    it('warns on env keys containing KEY, TOKEN, PASSWORD, CREDENTIAL', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        envAccess: ['API_KEY', 'AUTH_TOKEN', 'DB_PASSWORD', 'AWS_CREDENTIAL'],
      };
      const violations = checkViolations(trace, [], 'readonly');
      const envViolations = violations.filter((v) => v.type === 'undeclared_env');
      expect(envViolations).toHaveLength(4);
    });

    it('does not warn on non-sensitive env keys', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        envAccess: ['NODE_ENV', 'PORT', 'HOST'],
      };
      const violations = checkViolations(trace, [], 'readonly');
      const envViolations = violations.filter((v) => v.type === 'undeclared_env');
      expect(envViolations).toHaveLength(0);
    });
  });

  describe('permission_exceeded', () => {
    it('fails when readonly permission has fs write', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        fsOperations: [{ operation: 'write', path: '/tmp/out.txt', line: 3 }],
      };
      const violations = checkViolations(trace, [], 'readonly');
      expect(violations.some((v) => v.type === 'permission_exceeded')).toBe(true);
      expect(violations.find((v) => v.type === 'permission_exceeded')!.severity).toBe('fail');
    });

    it('fails when readonly permission has fs delete', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        fsOperations: [{ operation: 'delete', path: '/tmp/file.txt', line: 5 }],
      };
      const violations = checkViolations(trace, [], 'readonly');
      expect(violations.some((v) => v.type === 'permission_exceeded')).toBe(true);
    });

    it('does not fail for readonly with fs read only', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        fsOperations: [{ operation: 'read', path: '/data/config.json', line: 1 }],
      };
      const violations = checkViolations(trace, [], 'readonly');
      const permViolations = violations.filter((v) => v.type === 'permission_exceeded');
      expect(permViolations).toHaveLength(0);
    });

    it('fails when readonly permission has process spawns', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        processSpawns: ['ls -la'],
      };
      const violations = checkViolations(trace, [], 'readonly');
      expect(violations.some((v) => v.type === 'permission_exceeded')).toBe(true);
    });

    it('fails when readonly permission has dynamic eval', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        dynamicEval: ['eval('],
      };
      const violations = checkViolations(trace, [], 'readonly');
      const permViolations = violations.filter((v) => v.type === 'permission_exceeded');
      expect(permViolations.length).toBeGreaterThanOrEqual(1);
    });

    it('fails when limited_write permission has dynamic eval', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        dynamicEval: ['new Function('],
      };
      const violations = checkViolations(trace, [], 'limited_write');
      expect(violations.some((v) => v.type === 'permission_exceeded')).toBe(true);
    });

    it('does not fail for full_write with dynamic eval', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        dynamicEval: ['eval('],
      };
      const violations = checkViolations(trace, [], 'full_write');
      const permViolations = violations.filter((v) => v.type === 'permission_exceeded');
      expect(permViolations).toHaveLength(0);
    });

    it('does not fail for system permission with everything', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        fsOperations: [{ operation: 'write', path: '/tmp/out.txt', line: 1 }],
        processSpawns: ['node worker.js'],
        dynamicEval: ['eval('],
      };
      const violations = checkViolations(trace, [], 'system');
      const permViolations = violations.filter((v) => v.type === 'permission_exceeded');
      expect(permViolations).toHaveLength(0);
    });
  });

  describe('combined scenarios', () => {
    it('returns no violations for properly declared code', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'https://api.example.com/data', method: 'GET', line: 1 }],
        envAccess: ['NODE_ENV'],
        fsOperations: [{ operation: 'read', path: '/data/config.json', line: 2 }],
      };
      const violations = checkViolations(trace, ['https://api.example.com/'], 'readonly');
      expect(violations).toHaveLength(0);
    });

    it('returns multiple violation types at once', () => {
      const trace: BehaviorTrace = {
        ...emptyTrace(),
        networkCalls: [{ url: 'https://evil.com/steal', method: 'POST', line: 1 }],
        envAccess: ['SECRET_KEY'],
        fsOperations: [{ operation: 'write', path: '/tmp/out.txt', line: 3 }],
        dynamicEval: ['eval('],
      };
      const violations = checkViolations(trace, [], 'readonly');
      const types = new Set(violations.map((v) => v.type));
      expect(types.has('undeclared_url')).toBe(true);
      expect(types.has('undeclared_env')).toBe(true);
      expect(types.has('permission_exceeded')).toBe(true);
    });
  });
});
