/**
 * Periodic Re-scan Module
 * Re-scans published server dependencies via OSV.dev to detect new vulnerabilities.
 */
import { scanOsv, determineOverallStatus } from './external-scan.js';
import type { OsvResult, DepsDevResult, ExternalScanResult } from './external-scan.js';
import { calculateExternalBadge } from './badge.js';
import type { BadgeExternal } from '@mcp-platform/shared';

export interface RescanTarget {
  serverId: string;
  version: string;
  dependencies: Record<string, string>;
  currentBadgeExternal: string;
}

export interface RescanResult {
  serverId: string;
  version: string;
  previousBadge: string;
  newBadge: BadgeExternal;
  badgeChanged: boolean;
  vulnerabilitiesFound: number;
  scannedAt: string;
}

export interface RescanSummary {
  totalScanned: number;
  totalChanged: number;
  results: RescanResult[];
  completedAt: string;
}

/**
 * Create an empty DepsDevResult for re-scan (we only re-scan OSV).
 */
function createEmptyDepsDevResult(): DepsDevResult {
  return {
    provider: 'deps_dev',
    scorecardScore: null,
    licenses: [],
    dependencyCount: 0,
    advisoryCount: 0,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Re-scan a single server's dependencies via OSV.dev.
 */
export async function rescanServer(target: RescanTarget): Promise<RescanResult> {
  const osv = await scanOsv(target.dependencies);
  const depsDev = createEmptyDepsDevResult();
  const externalScan: ExternalScanResult = {
    osv,
    depsDev,
    overallStatus: determineOverallStatus(osv, depsDev),
  };

  const newBadge = calculateExternalBadge(externalScan);

  return {
    serverId: target.serverId,
    version: target.version,
    previousBadge: target.currentBadgeExternal,
    newBadge,
    badgeChanged: newBadge !== target.currentBadgeExternal,
    vulnerabilitiesFound: osv.vulnerabilities.length,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Re-scan all targets sequentially (to avoid OSV rate limiting).
 */
export async function rescanAll(targets: RescanTarget[]): Promise<RescanSummary> {
  const results: RescanResult[] = [];

  for (const target of targets) {
    const result = await rescanServer(target);
    results.push(result);
  }

  return {
    totalScanned: results.length,
    totalChanged: results.filter(r => r.badgeChanged).length,
    results,
    completedAt: new Date().toISOString(),
  };
}
