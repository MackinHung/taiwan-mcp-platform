import type { TradeStatRecord, TraderRecord, TariffRecord } from './types.js';

export const CUSTOMS_BASE = 'https://opendata.customs.gov.tw';
export const TRADE_BASE = 'https://www.trade.gov.tw/OpenData/getOpenData.aspx';
export const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

export async function fetchCustomsData(path: string): Promise<unknown[]> {
  const url = `${CUSTOMS_BASE}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Customs API error: ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'records' in data && Array.isArray(data.records)) {
    return data.records;
  }
  throw new Error('Customs API returned unexpected format');
}

export async function fetchTradeData(oid: string): Promise<unknown[]> {
  const url = `${TRADE_BASE}?oid=${encodeURIComponent(oid)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Trade API error: ${response.status}`);
  }
  const text = await response.text();

  // Try JSON first
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      return json;
    }
    if (json && typeof json === 'object' && Array.isArray(json.records)) {
      return json.records;
    }
    return [json];
  } catch {
    // Fall back to CSV parsing
    return parseCsv(text);
  }
}

export async function fetchOpenData(
  resourceId: string,
  params?: Record<string, string>
): Promise<unknown[]> {
  const url = new URL(`${OPENDATA_BASE}/${encodeURIComponent(resourceId)}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OpenData API error: ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'records' in data && Array.isArray(data.records)) {
    return data.records;
  }
  throw new Error('OpenData API returned unexpected format');
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;

    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] ?? '';
    }
    records.push(record);
  }

  return records;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function fetchTradeStats(
  params?: Record<string, string>
): Promise<TradeStatRecord[]> {
  // Trade statistics resource on data.gov.tw
  const resourceId = 'A0400000C-000032-001';
  const records = await fetchOpenData(resourceId, params);
  return records as TradeStatRecord[];
}

export async function fetchTraders(oid: string): Promise<TraderRecord[]> {
  const records = await fetchTradeData(oid);
  return records as TraderRecord[];
}

export async function fetchTariffs(): Promise<TariffRecord[]> {
  const records = await fetchCustomsData('/api/v1/tariff');
  return records as TariffRecord[];
}
