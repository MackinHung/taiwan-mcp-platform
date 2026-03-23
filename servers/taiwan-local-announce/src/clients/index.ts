import type { CityId, LocalAnnouncement } from '../types.js';
import { fetchTaipeiAnnouncements } from './taipei.js';
import { fetchNewtaipeiAnnouncements } from './newtaipei.js';
import { fetchTaoyuanAnnouncements } from './taoyuan.js';
import { fetchTaichungAnnouncements } from './taichung.js';
import { fetchTainanAnnouncements } from './tainan.js';
import { fetchKaohsiungAnnouncements } from './kaohsiung.js';

type CityFetcher = () => Promise<LocalAnnouncement[]>;

const CITY_FETCHERS: Record<CityId, CityFetcher> = {
  taipei: fetchTaipeiAnnouncements,
  newtaipei: fetchNewtaipeiAnnouncements,
  taoyuan: fetchTaoyuanAnnouncements,
  taichung: fetchTaichungAnnouncements,
  tainan: fetchTainanAnnouncements,
  kaohsiung: fetchKaohsiungAnnouncements,
};

export async function fetchCityAnnouncements(city: CityId): Promise<LocalAnnouncement[]> {
  const fetcher = CITY_FETCHERS[city];
  if (!fetcher) {
    throw new Error(`不支援的城市: ${city}`);
  }
  return fetcher();
}

export async function fetchAllCityAnnouncements(): Promise<LocalAnnouncement[]> {
  const results = await Promise.allSettled(
    Object.values(CITY_FETCHERS).map((fetcher) => fetcher())
  );

  const announcements: LocalAnnouncement[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      announcements.push(...result.value);
    }
  }

  return announcements.sort((a, b) => b.date.localeCompare(a.date));
}
