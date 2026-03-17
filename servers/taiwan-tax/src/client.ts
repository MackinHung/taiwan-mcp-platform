import type { BusinessTaxRecord, OpenDataResponse } from './types.js';

export const FIA_CSV_URL = 'https://eip.fia.gov.tw/data/BGMOPEN1.csv';
export const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

export function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }

  return rows;
}

export async function fetchBusinessTaxCsv(
  keyword: string
): Promise<BusinessTaxRecord[]> {
  const response = await fetch(FIA_CSV_URL);
  if (!response.ok) {
    throw new Error(`FIA API error: ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCsvRows(text);

  const filtered = rows.filter(
    (row) =>
      (row['統一編號'] && row['統一編號'].includes(keyword)) ||
      (row['營業人名稱'] && row['營業人名稱'].includes(keyword))
  );

  return filtered as BusinessTaxRecord[];
}

export async function fetchOpenData(
  resourceId: string,
  params: Record<string, string> = {}
): Promise<OpenDataResponse> {
  const url = new URL(`${OPENDATA_BASE}/${resourceId}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`data.gov.tw API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenDataResponse;
  if (!data.success) {
    throw new Error('data.gov.tw API returned unsuccessful response');
  }

  return data;
}
