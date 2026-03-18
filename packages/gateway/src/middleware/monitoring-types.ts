/**
 * Runtime Monitoring Constants & KV Key Builders
 */

// Monitoring thresholds
export const TOOL_ABUSE_THRESHOLD = 0.5;    // > 50% of calls on single tool
export const ERROR_SPIKE_THRESHOLD = 0.3;   // > 30% error rate
export const ERROR_SPIKE_MIN_REQUESTS = 10; // Minimum requests before checking
export const MONITORING_WINDOW_MINUTES = 5;

// KV key builders
export function getToolCountKey(serverId: string, toolName: string, windowMinute: number): string {
  return `mon-tool:${serverId}:${toolName}:${windowMinute}`;
}

export function getTotalCountKey(serverId: string, windowMinute: number): string {
  return `mon-total:${serverId}:${windowMinute}`;
}

export function getErrorCountKey(serverId: string, windowMinute: number): string {
  return `mon-error:${serverId}:${windowMinute}`;
}

export function getRequestCountKey(serverId: string, windowMinute: number): string {
  return `mon-req:${serverId}:${windowMinute}`;
}
