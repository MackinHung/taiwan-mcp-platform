export const TIPO_BASE = 'https://tiponet.tipo.gov.tw/datagov';
export const OPENDATA_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

export const TIPO_PATHS = {
  PATENT: '/patent_open_data.csv',
  TRADEMARK: '/trademark_open_data.csv',
} as const;

export const OPENDATA_RESOURCES = {
  IP_STATISTICS: '6b2e5542-44e3-4e12-8a3e-58f1ef896ea3',
} as const;

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
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
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());

  return fields;
}

export function buildTipoUrl(path: string): string {
  return `${TIPO_BASE}${path}`;
}

export function buildOpenDataUrl(
  resourceId: string,
  params?: Record<string, string>
): string {
  const url = new URL(`${OPENDATA_BASE}/${resourceId}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function fetchTipoCsv(path: string): Promise<Record<string, string>[]> {
  const url = buildTipoUrl(path);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TIPO API error: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseCsv(text);
}

export async function fetchOpenData(
  resourceId: string,
  params?: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const url = buildOpenDataUrl(resourceId, params);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenData API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as {
    success: boolean;
    result?: { records: Record<string, unknown>[] };
  };
  if (!data.success) {
    throw new Error('OpenData API returned unsuccessful response');
  }
  return data.result?.records ?? [];
}
