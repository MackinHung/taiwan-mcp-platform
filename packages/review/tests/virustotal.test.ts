import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanWithVirusTotal } from '../src/virustotal.js';
import type { VtScanResult } from '../src/virustotal.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('scanWithVirusTotal', () => {
  it('returns skipped when no API key', async () => {
    const result = await scanWithVirusTotal('const x = 1;', undefined);
    expect(result.status).toBe('skipped');
    expect(result.details).toContain('No VirusTotal API key');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns skipped when API key is empty string', async () => {
    const result = await scanWithVirusTotal('const x = 1;', '');
    expect(result.status).toBe('skipped');
  });

  it('returns skipped for empty source code', async () => {
    const result = await scanWithVirusTotal('', 'test-api-key');
    expect(result.status).toBe('skipped');
    expect(result.details).toContain('Empty source code');
  });

  it('returns skipped for whitespace-only source code', async () => {
    const result = await scanWithVirusTotal('   \n  \t  ', 'test-api-key');
    expect(result.status).toBe('skipped');
  });

  it('returns skipped when upload fails (non-ok response)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const result = await scanWithVirusTotal('const x = 1;', 'test-api-key');
    expect(result.status).toBe('skipped');
    expect(result.details).toContain('Failed to upload');
  });

  it('returns skipped when upload throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await scanWithVirusTotal('const x = 1;', 'test-api-key');
    expect(result.status).toBe('skipped');
  });

  it('returns skipped when no analysis ID returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });
    const result = await scanWithVirusTotal('const x = 1;', 'test-api-key');
    expect(result.status).toBe('skipped');
  });

  it('returns clean when no detections', async () => {
    // Upload succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'analysis-123' } }),
    });
    // Poll returns clean
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          attributes: {
            status: 'completed',
            stats: { malicious: 0, suspicious: 0, undetected: 10, harmless: 50 },
          },
        },
      }),
    });

    const result = await scanWithVirusTotal('const x = 1;', 'test-api-key');
    expect(result.status).toBe('clean');
    expect(result.detections).toBe(0);
    expect(result.totalEngines).toBe(60);
  });

  it('returns malicious when engines detect malware', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'analysis-456' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          attributes: {
            status: 'completed',
            stats: { malicious: 3, suspicious: 1, undetected: 50, harmless: 10 },
          },
        },
      }),
    });

    const result = await scanWithVirusTotal('eval("malware");', 'test-api-key');
    expect(result.status).toBe('malicious');
    expect(result.detections).toBe(4);
    expect(result.totalEngines).toBe(64);
    expect(result.details).toContain('3 engine(s) flagged as malicious');
  });

  it('returns suspicious when only suspicious detections', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'analysis-789' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          attributes: {
            status: 'completed',
            stats: { malicious: 0, suspicious: 2, undetected: 58, harmless: 10 },
          },
        },
      }),
    });

    const result = await scanWithVirusTotal('suspicious code;', 'test-api-key');
    expect(result.status).toBe('suspicious');
    expect(result.detections).toBe(2);
    expect(result.details).toContain('2 engine(s) flagged as suspicious');
  });

  it('returns skipped when poll returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'analysis-err' } }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await scanWithVirusTotal('code;', 'test-api-key');
    expect(result.status).toBe('skipped');
  });

  it('sends correct headers with API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'test-id' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { attributes: { status: 'completed', stats: { malicious: 0, suspicious: 0, undetected: 1, harmless: 1 } } },
      }),
    });

    await scanWithVirusTotal('code;', 'my-secret-key');

    // Check upload call
    const uploadCall = mockFetch.mock.calls[0];
    expect(uploadCall[0]).toContain('/files');
    expect(uploadCall[1].headers['x-apikey']).toBe('my-secret-key');

    // Check poll call
    const pollCall = mockFetch.mock.calls[1];
    expect(pollCall[0]).toContain('/analyses/test-id');
    expect(pollCall[1].headers['x-apikey']).toBe('my-secret-key');
  });

  it('VtScanResult has correct shape for skipped', async () => {
    const result = await scanWithVirusTotal('x', undefined);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('detections');
    expect(result).toHaveProperty('totalEngines');
    expect(result).toHaveProperty('details');
    expect(typeof result.detections).toBe('number');
    expect(typeof result.totalEngines).toBe('number');
  });

  it('VtScanResult has correct shape for clean', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'id' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { attributes: { status: 'completed', stats: { malicious: 0, suspicious: 0, undetected: 5, harmless: 5 } } },
      }),
    });

    const result = await scanWithVirusTotal('safe code;', 'key');
    expect(result.status).toBe('clean');
    expect(result.detections).toBe(0);
    expect(result.totalEngines).toBe(10);
  });

  it('handles poll with missing stats gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'id' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { attributes: { status: 'completed', stats: {} } },
      }),
    });

    const result = await scanWithVirusTotal('code;', 'key');
    expect(result.status).toBe('clean');
    expect(result.totalEngines).toBe(0);
  });

  it('uses FormData for file upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'id' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { attributes: { status: 'completed', stats: { malicious: 0, suspicious: 0, undetected: 1, harmless: 1 } } },
      }),
    });

    await scanWithVirusTotal('some code;', 'key');
    const uploadCall = mockFetch.mock.calls[0];
    expect(uploadCall[1].body).toBeInstanceOf(FormData);
  });

  it('returns skipped when poll throws an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'analysis-throw' } }),
    });
    mockFetch.mockRejectedValueOnce(new Error('Connection reset'));

    const result = await scanWithVirusTotal('code;', 'test-api-key');
    expect(result.status).toBe('skipped');
    expect(result.details).toContain('timed out');
  });

  it('returns correct detection count for malicious result', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'id' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          attributes: {
            status: 'completed',
            stats: { malicious: 5, suspicious: 3, undetected: 40, harmless: 20 },
          },
        },
      }),
    });

    const result = await scanWithVirusTotal('bad code;', 'key');
    expect(result.status).toBe('malicious');
    expect(result.detections).toBe(8);
    expect(result.totalEngines).toBe(68);
    expect(result.details).toContain('5 engine(s) flagged as malicious');
    expect(result.details).toContain('3 suspicious');
  });

  it('does not call fetch for empty API key with valid source', async () => {
    await scanWithVirusTotal('valid code;', '');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns skipped when upload returns null data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    const result = await scanWithVirusTotal('code;', 'key');
    expect(result.status).toBe('skipped');
    expect(result.details).toContain('Failed to upload');
  });
});
