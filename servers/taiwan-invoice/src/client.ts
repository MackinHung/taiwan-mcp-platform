import type { Env } from './types.js';

const EINVOICE_BASE = 'https://api.einvoice.nat.gov.tw/PB2CAPIVAN/invapp/InvApp';

export function buildUrl(env: Env, action: string, params: Record<string, string>): string {
  const url = new URL(EINVOICE_BASE);
  url.searchParams.set('version', '0.5');
  url.searchParams.set('action', action);
  url.searchParams.set('appID', env.EINVOICE_APP_ID);
  url.searchParams.set('UUID', env.EINVOICE_UUID);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function fetchApi<T>(
  env: Env,
  action: string,
  params: Record<string, string>
): Promise<T> {
  const url = buildUrl(env, action, params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`E-Invoice API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T & { code: number; msg: string };
  if (data.code !== 200) {
    throw new Error(`E-Invoice API error: ${data.msg || 'Unknown error'}`);
  }

  return data;
}

/** Get current invoice term (even month, ROC year) */
export function getCurrentTerm(): string {
  const now = new Date();
  const rocYear = now.getFullYear() - 1911;
  let month = now.getMonth() + 1;
  // Invoice terms are even months; if odd month, use previous even month
  if (month % 2 === 1) {
    month -= 1;
  }
  return `${rocYear}${String(month).padStart(2, '0')}`;
}

/** Convert YYYY-MM to ROC invoice term (e.g. '2026-02' -> '11502') */
export function toInvTerm(yearMonth?: string): string {
  if (!yearMonth) return getCurrentTerm();
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error(`Invalid period format: ${yearMonth}. Use YYYY-MM.`);
  }
  const rocYear = year - 1911;
  // Round down to even month
  const evenMonth = month % 2 === 1 ? month - 1 : month;
  // If evenMonth is 0 (from January), wrap to previous year December
  if (evenMonth === 0) {
    return `${rocYear - 1}12`;
  }
  return `${rocYear}${String(evenMonth).padStart(2, '0')}`;
}
