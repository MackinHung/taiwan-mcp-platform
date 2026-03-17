import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchApi, getCurrentTerm, toInvTerm } from '../src/client.js';
import type { Env } from '../src/types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env: Env = {
  EINVOICE_APP_ID: 'test-app-id',
  EINVOICE_UUID: 'test-uuid',
  SERVER_NAME: 'taiwan-invoice',
  SERVER_VERSION: '1.0.0',
};

describe('buildUrl', () => {
  it('constructs correct URL with action and default params', () => {
    const url = buildUrl(env, 'QryWinningList', {});
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://api.einvoice.nat.gov.tw/PB2CAPIVAN/invapp/InvApp'
    );
    expect(parsed.searchParams.get('version')).toBe('0.5');
    expect(parsed.searchParams.get('action')).toBe('QryWinningList');
    expect(parsed.searchParams.get('appID')).toBe('test-app-id');
    expect(parsed.searchParams.get('UUID')).toBe('test-uuid');
  });

  it('appends additional params to URL', () => {
    const url = buildUrl(env, 'QryWinningList', {
      generation: 'V2',
      invTerm: '11502',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('generation')).toBe('V2');
    expect(parsed.searchParams.get('invTerm')).toBe('11502');
  });

  it('handles empty additional params', () => {
    const url = buildUrl(env, 'qryInvHeader', {});
    const parsed = new URL(url);
    expect(parsed.searchParams.get('action')).toBe('qryInvHeader');
    // Should still have the base params
    expect(parsed.searchParams.get('version')).toBe('0.5');
  });
});

describe('fetchApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends correct request URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 200, msg: '執行成功', invoYm: '11502' }),
    });

    await fetchApi(env, 'QryWinningList', { generation: 'V2', invTerm: '11502' });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('action=QryWinningList');
    expect(calledUrl).toContain('invTerm=11502');
  });

  it('returns parsed data on success', async () => {
    const mockData = { code: 200, msg: '執行成功', invoYm: '11502', superPrizeNo: '12345678' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchApi(env, 'QryWinningList', { invTerm: '11502' });
    expect(result).toEqual(mockData);
  });

  it('throws on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchApi(env, 'QryWinningList', { invTerm: '11502' })
    ).rejects.toThrow('E-Invoice API error: 500 Internal Server Error');
  });

  it('throws on non-200 API code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 903, msg: '查無資料' }),
    });

    await expect(
      fetchApi(env, 'QryWinningList', { invTerm: '99902' })
    ).rejects.toThrow('E-Invoice API error: 查無資料');
  });

  it('throws with default message when API error has no msg', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 500, msg: '' }),
    });

    await expect(
      fetchApi(env, 'QryWinningList', {})
    ).rejects.toThrow('E-Invoice API error: Unknown error');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetchApi(env, 'QryWinningList', {})
    ).rejects.toThrow('Network error');
  });
});

describe('getCurrentTerm', () => {
  it('returns ROC year + even month', () => {
    const term = getCurrentTerm();
    // Term should be a string like "11502", "11504", etc.
    expect(term).toMatch(/^\d{3,4}\d{2}$/);
    // The month part should be even
    const monthPart = parseInt(term.slice(-2), 10);
    expect(monthPart % 2).toBe(0);
  });

  it('returns a term with ROC year (current year - 1911)', () => {
    const term = getCurrentTerm();
    const rocYear = parseInt(term.slice(0, -2), 10);
    const expectedRocYear = new Date().getFullYear() - 1911;
    // Could be current year or previous year if January
    expect(rocYear).toBeGreaterThanOrEqual(expectedRocYear - 1);
    expect(rocYear).toBeLessThanOrEqual(expectedRocYear);
  });
});

describe('toInvTerm', () => {
  it('converts YYYY-MM to ROC term', () => {
    expect(toInvTerm('2026-02')).toBe('11502');
  });

  it('converts another YYYY-MM to ROC term', () => {
    expect(toInvTerm('2026-08')).toBe('11508');
  });

  it('handles odd months by rounding down to previous even month', () => {
    expect(toInvTerm('2026-03')).toBe('11502');
    expect(toInvTerm('2026-07')).toBe('11506');
    expect(toInvTerm('2026-11')).toBe('11510');
  });

  it('handles January by wrapping to previous year December', () => {
    expect(toInvTerm('2026-01')).toBe('11412');
  });

  it('returns current term when no input provided', () => {
    const result = toInvTerm();
    expect(result).toBe(getCurrentTerm());
  });

  it('throws on invalid format', () => {
    expect(() => toInvTerm('invalid')).toThrow('Invalid period format');
  });
});
