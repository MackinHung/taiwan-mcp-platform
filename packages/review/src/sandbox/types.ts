export interface BehaviorTrace {
  networkCalls: { url: string; method: string; line: number }[];
  envAccess: string[];
  fsOperations: { operation: 'read' | 'write' | 'delete'; path: string; line: number }[];
  processSpawns: string[];
  dynamicEval: string[];
}

export interface SandboxViolation {
  type: 'undeclared_url' | 'undeclared_env' | 'permission_exceeded';
  evidence: string;
  severity: 'warn' | 'fail';
}

export interface SandboxResult {
  status: 'sandbox_passed' | 'sandbox_failed';
  details: string;
  durationMs: number;
  behaviorTrace?: BehaviorTrace;
  violations?: SandboxViolation[];
}

export interface SandboxInput {
  serverId: string;
  sourceCode: string;
  declaredExternalUrls?: string[];
  declaredPermissions?: 'readonly' | 'limited_write' | 'full_write' | 'system';
}
