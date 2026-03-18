import type { ReviewReport, DataSensitivity, DeclaredPermission } from '@mcp-platform/shared';
import { runScanner } from './scanner.js';
import type { ScanOutput } from './scanner.js';
import { calculateAllBadges } from './badge.js';
import type { AllBadges } from './badge.js';
import { createReviewReport } from './report.js';
import { runExternalScan } from './external-scan.js';
import type { ExternalScanResult } from './external-scan.js';
import { runSandbox } from './sandbox/index.js';
import type { SandboxResult } from './sandbox/index.js';
import { generateSbom } from './sbom.js';
import type { SbomDocument } from './sbom.js';
import { scanWithVirusTotal } from './virustotal.js';
import type { VtScanResult } from './virustotal.js';

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
  packageName?: string;
  packageVersion?: string;
  virusTotalApiKey?: string;
  knownLicenses?: Record<string, string>;
}

export interface PipelineResult {
  scanResult: ScanOutput;
  sandboxResult: SandboxResult;
  externalScan: ExternalScanResult;
  vtScan: VtScanResult;
  sbom: SbomDocument;
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

  // Layer 2: Behavioral sandbox (analyzes source code patterns vs declarations)
  const sandboxResult = await runSandbox({
    serverId: input.serverId,
    sourceCode: input.sourceCode,
    declaredExternalUrls: input.declaredExternalUrls,
    declaredPermissions: input.declaredPermissions,
  });

  // Layer 1.5: External security scan (runs in parallel-safe, never blocks pipeline)
  const [externalScan, vtScan] = await Promise.all([
    runExternalScan(
      input.dependencies,
      input.packageName,
      input.packageVersion
    ),
    scanWithVirusTotal(input.sourceCode, input.virusTotalApiKey),
  ]);

  // Generate SBOM
  const sbom = generateSbom(
    input.packageName || input.serverId,
    input.packageVersion || input.version,
    input.dependencies,
    input.knownLicenses
  );

  const scanDurationMs = Date.now() - start;

  // Calculate badges (including external badge)
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
    externalScan,
  });

  // Determine report status: sandbox fail or scan fail → fail
  const isFail = scanResult.status === 'scan_failed'
    || sandboxResult.status === 'sandbox_failed';
  const reportStatus = isFail ? 'fail' as const
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

  return { scanResult, sandboxResult, externalScan, vtScan, sbom, badges, report };
}
