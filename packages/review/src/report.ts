import type { ReviewReport } from '@mcp-platform/shared';

export interface CreateReportInput {
  serverId: string;
  version: string;
  layer: 1 | 2 | 3;
  status: 'pass' | 'warn' | 'fail';
  details: object;
  externalUrlsDetected: string[] | null;
  scanDurationMs: number;
  createdBy?: string | null;
}

export function createReviewReport(input: CreateReportInput): ReviewReport {
  return {
    id: crypto.randomUUID(),
    server_id: input.serverId,
    version: input.version,
    layer: input.layer,
    status: input.status,
    details: input.details,
    external_urls_detected: input.externalUrlsDetected,
    scan_duration_ms: input.scanDurationMs,
    created_by: input.createdBy ?? null,
    created_at: new Date().toISOString(),
  };
}
