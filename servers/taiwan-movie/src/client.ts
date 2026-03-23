import type { MovieRecord } from './types.js';

const CULTURE_BASE = 'https://cloud.culture.tw/frontsite/trans/emapOpenDataAction.do';

export function buildUrl(): string {
  const url = new URL(CULTURE_BASE);
  url.searchParams.set('method', 'exportEmapJson');
  url.searchParams.set('typeId', '8');
  return url.toString();
}

export async function fetchMovieData(): Promise<MovieRecord[]> {
  const url = buildUrl();
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Culture API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Culture API returned unexpected format');
  }

  return data as MovieRecord[];
}
