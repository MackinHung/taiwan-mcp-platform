import type { ReviewReport, DataSensitivity, DeclaredPermission } from '@mcp-platform/shared';
import { runScanner } from './scanner.js';
import type { ScanOutput } from './scanner.js';
import { calculateAllBadges } from './badge.js';
import type { AllBadges } from './badge.js';
import { createReviewReport } from './report.js';

export interface PipelineInput {
  serverId: string;
  version: string;
  sourceCode: string;
  toolDescriptions: string[];
  declaredExternalUrls: string[];
  dependencies: Record<string, string>;
  isOpenSource: boolean;
  auditPassed: boolean;
  repoUrl?: string | null;
  declaredDataSensitivity: DataSensitivity;
  verifiedDataSensitivity: DataSensitivity | null;
  declaredPermissions: DeclaredPermission;
  verifiedPermissions: DeclaredPermission | null;
  totalCalls: number;
  totalStars: number;
}

export interface PipelineResult {
  scanResult: ScanOutput;
  badges: AllBadges;
  report: ReviewReport;
}

export async function runReviewPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  const start = Date.now();

  // Layer 1: Static scan
  const scanResult = runScanner({
    sourceCode: input.sourceCode,
    toolDescriptions: input.toolDescriptions,
    declaredExternalUrls: input.declaredExternalUrls,
    dependencies: input.dependencies,
  });

  const scanDurationMs = Date.now() - start;

  // Calculate badges
  const badges = calculateAllBadges({
    isOpenSource: input.isOpenSource,
    auditPassed: input.auditPassed,
    repoUrl: input.repoUrl,
    declaredDataSensitivity: input.declaredDataSensitivity,
    verifiedDataSensitivity: input.verifiedDataSensitivity,
    declaredPermissions: input.declaredPermissions,
    verifiedPermissions: input.verifiedPermissions,
    totalCalls: input.totalCalls,
    totalStars: input.totalStars,
  });

  // Create report
  const reportStatus = scanResult.status === 'scan_failed' ? 'fail' as const
    : scanResult.hasWarnings ? 'warn' as const
    : 'pass' as const;

  const report = createReviewReport({
    serverId: input.serverId,
    version: input.version,
    layer: 1,
    status: reportStatus,
    details: { rules: scanResult.results },
    externalUrlsDetected: scanResult.externalUrlsDetected,
    scanDurationMs,
  });

  return { scanResult, badges, report };
}
