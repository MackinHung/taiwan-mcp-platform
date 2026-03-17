import { describe, it, expect } from 'vitest';
import { createReviewReport } from '../src/report.js';

describe('createReviewReport', () => {
  it('creates a Layer 1 report from scan results', () => {
    const report = createReviewReport({
      serverId: 'srv-1',
      version: '1.0.0',
      layer: 1,
      status: 'pass',
      details: { rules: [{ ruleName: 'eval-detect', pass: true, severity: 'info', details: 'Clean' }] },
      externalUrlsDetected: [],
      scanDurationMs: 42,
    });
    expect(report.server_id).toBe('srv-1');
    expect(report.version).toBe('1.0.0');
    expect(report.layer).toBe(1);
    expect(report.status).toBe('pass');
    expect(report.scan_duration_ms).toBe(42);
    expect(report.external_urls_detected).toEqual([]);
    expect(report.id).toBeDefined();
    expect(report.created_at).toBeDefined();
  });

  it('creates a Layer 2 report', () => {
    const report = createReviewReport({
      serverId: 'srv-2',
      version: '1.0.0',
      layer: 2,
      status: 'pass',
      details: { sandbox: 'passed' },
      externalUrlsDetected: null,
      scanDurationMs: 100,
    });
    expect(report.layer).toBe(2);
  });

  it('creates a failed report', () => {
    const report = createReviewReport({
      serverId: 'srv-3',
      version: '2.0.0',
      layer: 1,
      status: 'fail',
      details: { rules: [{ ruleName: 'eval-detect', pass: false, severity: 'fail', details: 'eval found' }] },
      externalUrlsDetected: ['https://evil.com'],
      scanDurationMs: 15,
    });
    expect(report.status).toBe('fail');
    expect(report.external_urls_detected).toContain('https://evil.com');
  });

  it('generates unique IDs', () => {
    const r1 = createReviewReport({
      serverId: 's1', version: '1.0.0', layer: 1, status: 'pass',
      details: {}, externalUrlsDetected: null, scanDurationMs: 1,
    });
    const r2 = createReviewReport({
      serverId: 's2', version: '1.0.0', layer: 1, status: 'pass',
      details: {}, externalUrlsDetected: null, scanDurationMs: 1,
    });
    expect(r1.id).not.toBe(r2.id);
  });

  it('includes scan results in details', () => {
    const details = { rules: [{ ruleName: 'test', pass: true }] };
    const report = createReviewReport({
      serverId: 's1', version: '1.0.0', layer: 1, status: 'pass',
      details, externalUrlsDetected: null, scanDurationMs: 5,
    });
    expect(report.details).toEqual(details);
  });

  it('sets correct layer number', () => {
    const report = createReviewReport({
      serverId: 's1', version: '1.0.0', layer: 3 as any, status: 'warn',
      details: {}, externalUrlsDetected: null, scanDurationMs: 10,
    });
    expect(report.layer).toBe(3);
  });

  it('includes scan duration', () => {
    const report = createReviewReport({
      serverId: 's1', version: '1.0.0', layer: 1, status: 'pass',
      details: {}, externalUrlsDetected: null, scanDurationMs: 999,
    });
    expect(report.scan_duration_ms).toBe(999);
  });

  it('status reflects scan outcome (warn)', () => {
    const report = createReviewReport({
      serverId: 's1', version: '1.0.0', layer: 1, status: 'warn',
      details: {}, externalUrlsDetected: null, scanDurationMs: 5,
    });
    expect(report.status).toBe('warn');
  });
});
