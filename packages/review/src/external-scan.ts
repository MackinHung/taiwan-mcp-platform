/**
 * External Security Scan Module
 * Integrates OSV.dev (CVE scanning) and deps.dev (dependency health)
 */

// --- Types ---

export interface OsvVulnerability {
  id: string;
  summary: string;
  severity: string;
  package: string;
}

export interface OsvResult {
  provider: 'osv';
  vulnerabilities: OsvVulnerability[];
  scannedAt: string;
}

export interface DepsDevResult {
  provider: 'deps_dev';
  scorecardScore: number | null;
  licenses: string[];
  dependencyCount: number;
  advisoryCount: number;
  scannedAt: string;
}

export interface ExternalScanResult {
  osv: OsvResult;
  depsDev: DepsDevResult;
  overallStatus: 'pass' | 'warn' | 'fail';
}

// --- Constants ---

const OSV_API_URL = 'https://api.osv.dev/v1/querybatch';
const DEPS_DEV_API_URL = 'https://api.deps.dev/v3alpha/systems/npm/packages';
const EXTERNAL_SCAN_TIMEOUT_MS = 5000;

// --- Helpers ---

function createEmptyOsvResult(): OsvResult {
  return { provider: 'osv', vulnerabilities: [], scannedAt: new Date().toISOString() };
}

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

export function determineOverallStatus(osv: OsvResult, depsDev: DepsDevResult): 'pass' | 'warn' | 'fail' {
  const hasCriticalOrHigh = osv.vulnerabilities.some(
    (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH'
  );
  if (hasCriticalOrHigh) return 'fail';

  const hasMedium = osv.vulnerabilities.some((v) => v.severity === 'MEDIUM');
  const lowScorecard = depsDev.scorecardScore !== null && depsDev.scorecardScore < 5;
  if (hasMedium || lowScorecard) return 'warn';

  return 'pass';
}

// --- OSV.dev Scanner ---

export async function scanOsv(dependencies: Record<string, string>): Promise<OsvResult> {
  const entries = Object.entries(dependencies);
  if (entries.length === 0) return createEmptyOsvResult();

  const queries = entries.map(([name, version]) => ({
    package: { name, ecosystem: 'npm' },
    version: version.replace(/^[\^~>=<]/, ''),
  }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_SCAN_TIMEOUT_MS);

  try {
    const response = await fetch(OSV_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`OSV API error: ${response.status}`);
      return createEmptyOsvResult();
    }

    const data = (await response.json()) as {
      results: Array<{
        vulns?: Array<{
          id: string;
          summary: string;
          database_specific?: { severity: string };
          affected?: Array<{ package?: { name: string } }>;
        }>;
      }>;
    };
    const vulnerabilities: OsvVulnerability[] = [];

    for (let i = 0; i < data.results.length; i++) {
      const result = data.results[i];
      if (result.vulns) {
        for (const vuln of result.vulns) {
          vulnerabilities.push({
            id: vuln.id,
            summary: vuln.summary || 'No summary available',
            severity: vuln.database_specific?.severity || 'UNKNOWN',
            package: entries[i][0],
          });
        }
      }
    }

    return { provider: 'osv', vulnerabilities, scannedAt: new Date().toISOString() };
  } catch (error) {
    console.error('OSV scan failed:', error);
    return createEmptyOsvResult();
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- deps.dev Scanner ---

export async function scanDepsDev(
  packageName: string,
  version: string
): Promise<DepsDevResult> {
  if (!packageName || !version) return createEmptyDepsDevResult();

  const cleanVersion = version.replace(/^[\^~>=<]/, '');
  const encodedName = encodeURIComponent(packageName);
  const url = `${DEPS_DEV_API_URL}/${encodedName}/versions/${encodeURIComponent(cleanVersion)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_SCAN_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`deps.dev API error: ${response.status}`);
      return createEmptyDepsDevResult();
    }

    const data = (await response.json()) as {
      scorecardV2?: { score?: number };
      licenses?: string[];
      dependencyCount?: number;
      advisoryCount?: number;
    };

    return {
      provider: 'deps_dev',
      scorecardScore: data.scorecardV2?.score ?? null,
      licenses: data.licenses || [],
      dependencyCount: data.dependencyCount || 0,
      advisoryCount: data.advisoryCount || 0,
      scannedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('deps.dev scan failed:', error);
    return createEmptyDepsDevResult();
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- Main Entry ---

export async function runExternalScan(
  dependencies: Record<string, string>,
  packageName?: string,
  packageVersion?: string
): Promise<ExternalScanResult> {
  const [osv, depsDev] = await Promise.all([
    scanOsv(dependencies),
    packageName && packageVersion
      ? scanDepsDev(packageName, packageVersion)
      : Promise.resolve(createEmptyDepsDevResult()),
  ]);

  return {
    osv,
    depsDev,
    overallStatus: determineOverallStatus(osv, depsDev),
  };
}
