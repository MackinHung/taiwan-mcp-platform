import type { MuseumRecord } from './types.js';

const CULTURE_BASE = 'https://cloud.culture.tw/frontsite/trans/emapOpenDataAction.do';

export function buildUrl(typeId: string = '3'): string {
  const url = new URL(CULTURE_BASE);
  url.searchParams.set('method', 'exportEmapJson');
  url.searchParams.set('typeId', typeId);
  return url.toString();
}

export async function fetchMuseumData(typeId: string = '3'): Promise<MuseumRecord[]> {
  const url = buildUrl(typeId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Culture API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Culture API returned unexpected format');
  }

  return data as MuseumRecord[];
}
