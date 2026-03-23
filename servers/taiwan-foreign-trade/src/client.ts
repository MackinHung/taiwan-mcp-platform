import type { TradePage, ImportRegulation, EcaFtaAgreement } from './types.js';

const JSON_BASE = 'https://www.trade.gov.tw/API/Api/Get/pages';
const CSV_BASE = 'https://www.trade.gov.tw/OpenData/getOpenData.aspx';

const CSV_OID_INDUSTRIAL = '2963FE111E70103D';
const CSV_OID_AGRICULTURAL = 'FB7B56F7A69CE4BC';
const CSV_OID_OTHER = '5AA966ECD020763C';
const CSV_OID_ECA_FTA = '33D60405F3F56533';

export function getJsonApiUrl(nodeId: number): string {
  return `${JSON_BASE}?nodeid=${nodeId}&openData=true`;
}

export function getCsvApiUrl(oid: string): string {
  return `${CSV_BASE}?oid=${oid}`;
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format PagePublishTime "YYYYMMDDHHmmss" to "YYYY/MM/DD HH:mm"
 */
export function formatPublishTime(raw: string): string {
  if (!raw || raw.length < 8) return raw || '';
  const date = `${raw.slice(0, 4)}/${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
  if (raw.length >= 12) {
    return `${date} ${raw.slice(8, 10)}:${raw.slice(10, 12)}`;
  }
  return date;
}

/** Fetch JSON pages from trade.gov.tw API */
export async function fetchTradePages(nodeId: number): Promise<TradePage[]> {
  const url = getJsonApiUrl(nodeId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Trade API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data as TradePage[];
}

/** Parse semicolon-separated CSV text into rows of string arrays */
export function parseSemicolonCsv(text: string): string[][] {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return []; // header only or empty
  // Skip header row
  return lines.slice(1).map((line) => line.split(';').map((cell) => cell.trim()));
}

/** Fetch and parse import regulations CSV */
export async function fetchImportRegulations(
  category: 'industrial' | 'agricultural' | 'other'
): Promise<ImportRegulation[]> {
  const oidMap: Record<string, string> = {
    industrial: CSV_OID_INDUSTRIAL,
    agricultural: CSV_OID_AGRICULTURAL,
    other: CSV_OID_OTHER,
  };
  const oid = oidMap[category];
  const url = getCsvApiUrl(oid);

  const response = await fetch(url, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Import regulations API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const rows = parseSemicolonCsv(text);

  return rows.map((cols) => ({
    category,
    number: cols[0] ?? '',
    subject: cols[1] ?? '',
    basis: cols[2] ?? '',
    description: cols[3] ?? '',
  }));
}

/** Fetch all import regulations from all 3 categories */
export async function fetchAllImportRegulations(): Promise<ImportRegulation[]> {
  const categories: Array<'industrial' | 'agricultural' | 'other'> = [
    'industrial',
    'agricultural',
    'other',
  ];

  const results = await Promise.all(
    categories.map((cat) => fetchImportRegulations(cat))
  );

  return results.flat();
}

/** Fetch and parse ECA/FTA agreements CSV */
export async function fetchEcaFtaAgreements(): Promise<EcaFtaAgreement[]> {
  const url = getCsvApiUrl(CSV_OID_ECA_FTA);

  const response = await fetch(url, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`ECA/FTA API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const rows = parseSemicolonCsv(text);

  return rows.map((cols) => ({
    name: cols[0] ?? '',
    effectiveDate: cols[1] ?? '',
    partnerCode: cols[2] ?? '',
    partnerCountry: cols[3] ?? '',
    characteristics: cols[4] ?? '',
  }));
}
