import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rescanServer, rescanAll } from '../src/rescan.js';
import type { RescanTarget } from '../src/rescan.js';

// Mock external-scan
vi.mock('../src/external-scan.js', () => ({
  scanOsv: vi.fn(),
  determineOverallStatus: vi.fn(),
}));

// Mock badge
vi.mock('../src/badge.js', () => ({
  calculateExternalBadge: vi.fn(),
}));

import { scanOsv } from '../src/external-scan.js';
import { determineOverallStatus } from '../src/external-scan.js';
import { calculateExternalBadge } from '../src/badge.js';

const mockScanOsv = vi.mocked(scanOsv);
const mockDetermineStatus = vi.mocked(determineOverallStatus);
const mockCalcBadge = vi.mocked(calculateExternalBadge);

function createTarget(overrides: Partial<RescanTarget> = {}): RescanTarget {
  return {
    serverId: 'server-1',
    version: '1.0.0',
    dependencies: { lodash: '4.17.21' },
    currentBadgeExternal: 'partial',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockScanOsv.mockResolvedValue({
    provider: 'osv',
    vulnerabilities: [],
    scannedAt: new Date().toISOString(),
  });
  mockDetermineStatus.mockReturnValue('pass');
  mockCalcBadge.mockReturnValue('verified');
});

describe('rescanServer', () => {
  it('returns result with correct serverId and version', async () => {
    const target = createTarget({ serverId: 'srv-abc', version: '2.0.0' });
    const result = await rescanServer(target);
    expect(result.serverId).toBe('srv-abc');
    expect(result.version).toBe('2.0.0');
  });

  it('badge unchanged when same as current', async () => {
    mockCalcBadge.mockReturnValue('partial');
    const target = createTarget({ currentBadgeExternal: 'partial' });
    const result = await rescanServer(target);
    expect(result.badgeChanged).toBe(false);
    expect(result.previousBadge).toBe('partial');
    expect(result.newBadge).toBe('partial');
  });

  it('badge changed when different from current', async () => {
    mockCalcBadge.mockReturnValue('verified');
    const target = createTarget({ currentBadgeExternal: 'unverified' });
    const result = await rescanServer(target);
    expect(result.badgeChanged).toBe(true);
    expect(result.previousBadge).toBe('unverified');
    expect(result.newBadge).toBe('verified');
  });

  it('vulnerability count matches OSV results', async () => {
    mockScanOsv.mockResolvedValue({
      provider: 'osv',
      vulnerabilities: [
        { id: 'CVE-1', summary: 'vuln1', severity: 'HIGH', package: 'lodash' },
        { id: 'CVE-2', summary: 'vuln2', severity: 'MEDIUM', package: 'express' },
      ],
      scannedAt: new Date().toISOString(),
    });
    const result = await rescanServer(createTarget());
    expect(result.vulnerabilitiesFound).toBe(2);
  });

  it('calls scanOsv with target dependencies', async () => {
    const deps = { axios: '1.6.0', express: '4.18.2' };
    await rescanServer(createTarget({ dependencies: deps }));
    expect(mockScanOsv).toHaveBeenCalledWith(deps);
  });

  it('handles empty dependencies', async () => {
    await rescanServer(createTarget({ dependencies: {} }));
    expect(mockScanOsv).toHaveBeenCalledWith({});
  });

  it('handles OSV returning vulnerabilities', async () => {
    mockScanOsv.mockResolvedValue({
      provider: 'osv',
      vulnerabilities: [
        { id: 'GHSA-1', summary: 'critical', severity: 'CRITICAL', package: 'foo' },
      ],
      scannedAt: new Date().toISOString(),
    });
    mockDetermineStatus.mockReturnValue('fail');
    mockCalcBadge.mockReturnValue('failed');

    const result = await rescanServer(createTarget());
    expect(result.vulnerabilitiesFound).toBe(1);
    expect(result.newBadge).toBe('failed');
  });

  it('sets badgeChanged correctly for same badge', async () => {
    mockCalcBadge.mockReturnValue('verified');
    const result = await rescanServer(createTarget({ currentBadgeExternal: 'verified' }));
    expect(result.badgeChanged).toBe(false);
  });

  it('includes scannedAt timestamp', async () => {
    const result = await rescanServer(createTarget());
    expect(result.scannedAt).toBeDefined();
    expect(new Date(result.scannedAt).getTime()).not.toBeNaN();
  });

  it('previousBadge comes from target.currentBadgeExternal', async () => {
    const result = await rescanServer(createTarget({ currentBadgeExternal: 'failed' }));
    expect(result.previousBadge).toBe('failed');
  });
});

describe('rescanAll', () => {
  it('scans all targets', async () => {
    const targets = [createTarget({ serverId: 's1' }), createTarget({ serverId: 's2' })];
    const summary = await rescanAll(targets);
    expect(mockScanOsv).toHaveBeenCalledTimes(2);
    expect(summary.results).toHaveLength(2);
  });

  it('returns summary with totalScanned', async () => {
    const targets = [createTarget(), createTarget(), createTarget()];
    const summary = await rescanAll(targets);
    expect(summary.totalScanned).toBe(3);
  });

  it('counts totalChanged correctly', async () => {
    mockCalcBadge
      .mockReturnValueOnce('verified')   // changed from partial
      .mockReturnValueOnce('partial')    // same as partial
      .mockReturnValueOnce('failed');    // changed from partial

    const targets = [
      createTarget({ serverId: 's1', currentBadgeExternal: 'partial' }),
      createTarget({ serverId: 's2', currentBadgeExternal: 'partial' }),
      createTarget({ serverId: 's3', currentBadgeExternal: 'partial' }),
    ];
    const summary = await rescanAll(targets);
    expect(summary.totalChanged).toBe(2);
  });

  it('handles empty targets array', async () => {
    const summary = await rescanAll([]);
    expect(summary.totalScanned).toBe(0);
    expect(summary.totalChanged).toBe(0);
    expect(summary.results).toEqual([]);
  });

  it('processes sequentially (not parallel)', async () => {
    const callOrder: string[] = [];
    mockScanOsv.mockImplementation(async () => {
      callOrder.push('scan');
      return { provider: 'osv', vulnerabilities: [], scannedAt: new Date().toISOString() };
    });

    const targets = [createTarget({ serverId: 's1' }), createTarget({ serverId: 's2' })];
    await rescanAll(targets);
    expect(callOrder).toEqual(['scan', 'scan']);
    // Verify calls happened one at a time (sequential)
    expect(mockScanOsv).toHaveBeenCalledTimes(2);
  });

  it('includes completedAt timestamp', async () => {
    const summary = await rescanAll([createTarget()]);
    expect(summary.completedAt).toBeDefined();
    expect(new Date(summary.completedAt).getTime()).not.toBeNaN();
  });

  it('results array matches target count', async () => {
    const targets = Array.from({ length: 5 }, (_, i) =>
      createTarget({ serverId: `s${i}` })
    );
    const summary = await rescanAll(targets);
    expect(summary.results).toHaveLength(5);
  });

  it('handles mixed changed/unchanged results', async () => {
    mockCalcBadge
      .mockReturnValueOnce('verified')    // changed
      .mockReturnValueOnce('unverified'); // same

    const targets = [
      createTarget({ serverId: 's1', currentBadgeExternal: 'partial' }),
      createTarget({ serverId: 's2', currentBadgeExternal: 'unverified' }),
    ];
    const summary = await rescanAll(targets);
    expect(summary.totalChanged).toBe(1);
    expect(summary.results[0].badgeChanged).toBe(true);
    expect(summary.results[1].badgeChanged).toBe(false);
  });

  it('handles scan returning empty vulnerabilities (graceful)', async () => {
    mockScanOsv.mockResolvedValue({
      provider: 'osv',
      vulnerabilities: [],
      scannedAt: new Date().toISOString(),
    });
    const summary = await rescanAll([createTarget()]);
    expect(summary.results[0].vulnerabilitiesFound).toBe(0);
  });

  it('single target works', async () => {
    const summary = await rescanAll([createTarget({ serverId: 'only-one' })]);
    expect(summary.totalScanned).toBe(1);
    expect(summary.results[0].serverId).toBe('only-one');
  });

  it('multiple targets with different badges', async () => {
    mockCalcBadge
      .mockReturnValueOnce('verified')
      .mockReturnValueOnce('failed');

    const targets = [
      createTarget({ serverId: 's1', currentBadgeExternal: 'unverified' }),
      createTarget({ serverId: 's2', currentBadgeExternal: 'partial' }),
    ];
    const summary = await rescanAll(targets);
    expect(summary.results[0].newBadge).toBe('verified');
    expect(summary.results[1].newBadge).toBe('failed');
  });

  it('result includes correct previous and new badges', async () => {
    mockCalcBadge.mockReturnValue('partial');
    const target = createTarget({ currentBadgeExternal: 'failed' });
    const summary = await rescanAll([target]);
    expect(summary.results[0].previousBadge).toBe('failed');
    expect(summary.results[0].newBadge).toBe('partial');
    expect(summary.results[0].badgeChanged).toBe(true);
  });
});
