import type { TransactionRecord } from './types.js';

const FETCH_TIMEOUT_MS = 10000;

/**
 * Dataset IDs for regional open data APIs.
 * Primary source: New Taipei City (data.ntpc.gov.tw) — largest dataset.
 * Additional cities can be added as needed.
 */
export const DATASETS = {
  /** 新北市不動產買賣實價登錄 */
  NTPC_REALESTATE: 'acce802d-58cc-4dff-9e7a-9ecc517f78be',
} as const;

/** Base URL for New Taipei City open data API */
const NTPC_BASE = 'https://data.ntpc.gov.tw/api/datasets';

/**
 * Build URL for regional open data API.
 * @param datasetId - Dataset UUID
 * @param params - Query parameters (page, size, etc.)
 */
export function buildUrl(
  datasetId: string,
  params?: Record<string, string>
): string {
  const url = new URL(`${NTPC_BASE}/${datasetId}/json/file`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/**
 * Fetch transaction data from regional open data API with timeout.
 * @param datasetId - Dataset UUID
 * @param params - Query parameters
 * @returns Array of transaction records
 */
export async function fetchTransactions(
  datasetId: string,
  params?: Record<string, string>
): Promise<TransactionRecord[]> {
  const url = buildUrl(datasetId, params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('API returned non-array response');
    }
    return data as TransactionRecord[];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convert ROC date (e.g. "1140101") to western date string "2025/01/01".
 * If already in western format or unrecognizable, returns as-is.
 */
export function parseRocDate(rocDate: string | undefined): string {
  if (!rocDate) return '未知日期';
  const cleaned = rocDate.replace(/\//g, '').trim();
  if (cleaned.length === 7) {
    const year = parseInt(cleaned.substring(0, 3), 10) + 1911;
    const month = cleaned.substring(3, 5);
    const day = cleaned.substring(5, 7);
    return `${year}/${month}/${day}`;
  }
  if (cleaned.length === 8 && cleaned.startsWith('20')) {
    return `${cleaned.substring(0, 4)}/${cleaned.substring(4, 6)}/${cleaned.substring(6, 8)}`;
  }
  return rocDate;
}

/**
 * Parse a ROC date string to a YYYYMM period string for trend grouping.
 */
export function parseRocDateToPeriod(rocDate: string | undefined): string | null {
  if (!rocDate) return null;
  const cleaned = rocDate.replace(/\//g, '').trim();
  if (cleaned.length === 7) {
    const year = parseInt(cleaned.substring(0, 3), 10) + 1911;
    const month = cleaned.substring(3, 5);
    return `${year}${month}`;
  }
  if (cleaned.length === 8 && cleaned.startsWith('20')) {
    return cleaned.substring(0, 6);
  }
  return null;
}

/**
 * Convert a YYYYMM input to ROC-compatible prefix for filtering.
 * E.g., "202501" -> "1140" (ROC year 114, month 01).
 */
export function westernToRocPrefix(yyyymm: string): string {
  if (yyyymm.length < 4) return yyyymm;
  const year = parseInt(yyyymm.substring(0, 4), 10) - 1911;
  const rest = yyyymm.substring(4);
  return `${year}${rest}`;
}

/**
 * Safely parse numeric string, returning 0 if invalid.
 */
export function safeParseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert square meters to 坪 (1 坪 = 3.30579 m²).
 */
export function sqmToPing(sqm: number): number {
  return Math.round((sqm / 3.30579) * 100) / 100;
}
