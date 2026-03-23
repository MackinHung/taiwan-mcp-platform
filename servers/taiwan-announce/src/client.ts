import type { Announcement } from './types.js';

const API_URL = 'https://www.good.nat.gov.tw/odbbs/opendata/v1/json';

export function getApiUrl(): string {
  return API_URL;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`公告 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data as Announcement[];
}
