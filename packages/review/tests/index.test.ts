import { describe, it, expect } from 'vitest';
import { runReviewPipeline } from '../src/pipeline.js';

describe('runReviewPipeline (Layer flow)', () => {
  it('scan_passed => queues sandbox (returns scan_passed)', async () => {
    const result = await runReviewPipeline({
      serverId: 'srv-1',
      version: '1.0.0',
      sourceCode: 'const x = 1;',
      toolDescriptions: ['Adds numbers.'],
      declaredExternalUrls: [],
      dependencies: {},
      isOpenSource: true,
      auditPassed: false,
      declaredDataSensitivity: 'public',
      verifiedDataSensitivity: null,
      declaredPermissions: 'readonly',
      verifiedPermissions: null,
      totalCalls: 0,
      totalStars: 0,
    });
    expect(result.scanResult.status).toBe('scan_passed');
    expect(result.report.layer).toBe(1);
    expect(result.report.status).toBe('pass');
    expect(result.badges.badge_source).toBe('open');
  });

  it('scan_failed => rejected (no sandbox)', async () => {
    const result = await runReviewPipeline({
      serverId: 'srv-2',
      version: '1.0.0',
      sourceCode: 'eval("hack");',
      toolDescriptions: [],
      declaredExternalUrls: [],
      dependencies: {},
      isOpenSource: false,
      auditPassed: false,
      declaredDataSensitivity: 'public',
      verifiedDataSensitivity: null,
      declaredPermissions: 'readonly',
      verifiedPermissions: null,
      totalCalls: 0,
      totalStars: 0,
    });
    expect(result.scanResult.status).toBe('scan_failed');
    expect(result.report.status).toBe('fail');
  });

  it('returns badges alongside scan results', async () => {
    const result = await runReviewPipeline({
      serverId: 'srv-3',
      version: '1.0.0',
      sourceCode: 'console.log("hi");',
      toolDescriptions: [],
      declaredExternalUrls: [],
      dependencies: {},
      isOpenSource: true,
      auditPassed: true,
      declaredDataSensitivity: 'account',
      verifiedDataSensitivity: 'personal',
      declaredPermissions: 'limited_write',
      verifiedPermissions: null,
      totalCalls: 5000,
      totalStars: 20,
    });
    expect(result.badges.badge_source).toBe('open_audited');
    expect(result.badges.badge_data).toBe('personal');
    expect(result.badges.badge_permission).toBe('limited_write');
    expect(result.badges.badge_community).toBe('popular');
  });

  it('includes scan duration in report', async () => {
    const result = await runReviewPipeline({
      serverId: 'srv-4',
      version: '1.0.0',
      sourceCode: 'const x = 1;',
      toolDescriptions: [],
      declaredExternalUrls: [],
      dependencies: {},
      isOpenSource: false,
      auditPassed: false,
      declaredDataSensitivity: 'public',
      verifiedDataSensitivity: null,
      declaredPermissions: 'readonly',
      verifiedPermissions: null,
      totalCalls: 0,
      totalStars: 0,
    });
    expect(typeof result.report.scan_duration_ms).toBe('number');
    expect(result.report.scan_duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('returns complete review result structure', async () => {
    const result = await runReviewPipeline({
      serverId: 'srv-5',
      version: '2.0.0',
      sourceCode: 'const y = 2;',
      toolDescriptions: ['Gets weather.'],
      declaredExternalUrls: [],
      dependencies: {},
      isOpenSource: true,
      auditPassed: true,
      declaredDataSensitivity: 'public',
      verifiedDataSensitivity: null,
      declaredPermissions: 'readonly',
      verifiedPermissions: null,
      totalCalls: 20000,
      totalStars: 100,
    });
    expect(result).toHaveProperty('scanResult');
    expect(result).toHaveProperty('badges');
    expect(result).toHaveProperty('report');
    expect(result).toHaveProperty('externalScan');
    expect(result.externalScan.osv.provider).toBe('osv');
    expect(result.externalScan.depsDev.provider).toBe('deps_dev');
    expect(result.badges.badge_community).toBe('trusted');
  });
});
