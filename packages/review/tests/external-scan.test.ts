import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  scanOsv,
  scanDepsDev,
  runExternalScan,
  determineOverallStatus,
} from '../src/external-scan.js';
import type { OsvResult, DepsDevResult } from '../src/external-scan.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// --- scanOsv ---

describe('scanOsv', () => {
  it('returns empty result for empty dependencies', async () => {
    const result = await scanOsv({});
    expect(result.provider).toBe('osv');
    expect(result.vulnerabilities).toEqual([]);
    expect(result.scannedAt).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns vulnerabilities when API reports them', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            vulns: [
              {
                id: 'GHSA-1234',
                summary: 'XSS vulnerability',
                database_specific: { severity: 'HIGH' },
              },
              {
                id: 'GHSA-5678',
                summary: 'Prototype pollution',
                database_specific: { severity: 'CRITICAL' },
              },
            ],
          },
        ],
      }),
    });

    const result = await scanOsv({ lodash: '4.17.20' });
    expect(result.vulnerabilities).toHaveLength(2);
    expect(result.vulnerabilities[0]).toEqual({
      id: 'GHSA-1234',
      summary: 'XSS vulnerability',
      severity: 'HIGH',
      package: 'lodash',
    });
    expect(result.vulnerabilities[1].severity).toBe('CRITICAL');
  });

  it('returns empty vulnerabilities for clean dependencies', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ vulns: undefined }] }),
    });

    const result = await scanOsv({ hono: '^4.7.0' });
    expect(result.vulnerabilities).toEqual([]);
  });

  it('returns empty result on API error (non-ok response)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await scanOsv({ lodash: '4.17.20' });
    expect(result.provider).toBe('osv');
    expect(result.vulnerabilities).toEqual([]);
  });

  it('returns empty result on fetch timeout/abort', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const result = await scanOsv({ lodash: '4.17.20' });
    expect(result.provider).toBe('osv');
    expect(result.vulnerabilities).toEqual([]);
  });

  it('strips version prefix characters before querying', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{}] }),
    });

    await scanOsv({ hono: '^4.7.0' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.queries[0].version).toBe('4.7.0');
  });

  it('defaults severity to UNKNOWN when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            vulns: [{ id: 'CVE-2024-001', summary: 'Issue' }],
          },
        ],
      }),
    });

    const result = await scanOsv({ pkg: '1.0.0' });
    expect(result.vulnerabilities[0].severity).toBe('UNKNOWN');
  });
});

// --- scanDepsDev ---

describe('scanDepsDev', () => {
  it('returns scorecard data for valid package', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scorecardV2: { score: 8.5 },
        licenses: ['MIT'],
        dependencyCount: 12,
        advisoryCount: 0,
      }),
    });

    const result = await scanDepsDev('hono', '4.7.0');
    expect(result.provider).toBe('deps_dev');
    expect(result.scorecardScore).toBe(8.5);
    expect(result.licenses).toEqual(['MIT']);
    expect(result.dependencyCount).toBe(12);
    expect(result.advisoryCount).toBe(0);
  });

  it('returns empty result for missing packageName', async () => {
    const result = await scanDepsDev('', '1.0.0');
    expect(result.provider).toBe('deps_dev');
    expect(result.scorecardScore).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty result for missing version', async () => {
    const result = await scanDepsDev('hono', '');
    expect(result.scorecardScore).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty result on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await scanDepsDev('nonexistent-pkg', '1.0.0');
    expect(result.provider).toBe('deps_dev');
    expect(result.scorecardScore).toBeNull();
  });

  it('returns empty result on fetch timeout', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const result = await scanDepsDev('hono', '4.7.0');
    expect(result.provider).toBe('deps_dev');
    expect(result.scorecardScore).toBeNull();
  });
});

// --- runExternalScan ---

describe('runExternalScan', () => {
  it('returns fail status when critical CVE found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            vulns: [
              { id: 'CVE-CRITICAL', summary: 'RCE', database_specific: { severity: 'CRITICAL' } },
            ],
          },
        ],
      }),
    });

    const result = await runExternalScan({ lodash: '4.17.20' });
    expect(result.overallStatus).toBe('fail');
    expect(result.osv.vulnerabilities).toHaveLength(1);
  });

  it('returns warn status when medium CVE found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            vulns: [
              { id: 'CVE-MED', summary: 'Medium issue', database_specific: { severity: 'MEDIUM' } },
            ],
          },
        ],
      }),
    });

    const result = await runExternalScan({ somelib: '1.0.0' });
    expect(result.overallStatus).toBe('warn');
  });

  it('returns warn status when scorecard is low', async () => {
    // First call: OSV (clean)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{}] }),
    });
    // Second call: deps.dev (low scorecard)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scorecardV2: { score: 3.0 },
        licenses: ['MIT'],
        dependencyCount: 5,
        advisoryCount: 0,
      }),
    });

    const result = await runExternalScan({ hono: '4.7.0' }, 'hono', '4.7.0');
    expect(result.overallStatus).toBe('warn');
  });

  it('returns pass status for clean dependencies', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{}] }),
    });

    const result = await runExternalScan({ hono: '4.7.0' });
    expect(result.overallStatus).toBe('pass');
  });

  it('skips deps.dev when no packageName provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{}] }),
    });

    const result = await runExternalScan({ hono: '4.7.0' });
    expect(result.depsDev.scorecardScore).toBeNull();
    // Only 1 fetch call (OSV), not 2
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// --- determineOverallStatus ---

describe('determineOverallStatus', () => {
  const baseOsv: OsvResult = { provider: 'osv', vulnerabilities: [], scannedAt: '2026-01-01T00:00:00Z' };
  const baseDeps: DepsDevResult = {
    provider: 'deps_dev',
    scorecardScore: null,
    licenses: [],
    dependencyCount: 0,
    advisoryCount: 0,
    scannedAt: '2026-01-01T00:00:00Z',
  };

  it('returns pass when no vulnerabilities and no scorecard', () => {
    expect(determineOverallStatus(baseOsv, baseDeps)).toBe('pass');
  });

  it('returns fail for HIGH severity vulnerability', () => {
    const osv: OsvResult = {
      ...baseOsv,
      vulnerabilities: [{ id: 'X', summary: 's', severity: 'HIGH', package: 'p' }],
    };
    expect(determineOverallStatus(osv, baseDeps)).toBe('fail');
  });

  it('returns fail for CRITICAL severity vulnerability', () => {
    const osv: OsvResult = {
      ...baseOsv,
      vulnerabilities: [{ id: 'X', summary: 's', severity: 'CRITICAL', package: 'p' }],
    };
    expect(determineOverallStatus(osv, baseDeps)).toBe('fail');
  });

  it('returns warn for MEDIUM severity vulnerability', () => {
    const osv: OsvResult = {
      ...baseOsv,
      vulnerabilities: [{ id: 'X', summary: 's', severity: 'MEDIUM', package: 'p' }],
    };
    expect(determineOverallStatus(osv, baseDeps)).toBe('warn');
  });

  it('returns warn for low scorecard score (<5)', () => {
    const deps: DepsDevResult = { ...baseDeps, scorecardScore: 3.5 };
    expect(determineOverallStatus(baseOsv, deps)).toBe('warn');
  });

  it('returns pass for scorecard >= 5 and no vulnerabilities', () => {
    const deps: DepsDevResult = { ...baseDeps, scorecardScore: 7.0 };
    expect(determineOverallStatus(baseOsv, deps)).toBe('pass');
  });

  it('returns pass for LOW severity vulnerability (not medium/high/critical)', () => {
    const osv: OsvResult = {
      ...baseOsv,
      vulnerabilities: [{ id: 'X', summary: 's', severity: 'LOW', package: 'p' }],
    };
    expect(determineOverallStatus(osv, baseDeps)).toBe('pass');
  });
});
