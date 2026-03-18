import type { UniversityRecord, JuniorHighRecord, HighSchoolRecord, SchoolRecord } from './types.js';

/**
 * MOE Statistics data URLs
 * 大專校院名錄 — Dataset #6091
 * 國民中學名錄 — Dataset #6150 (j1_new)
 * 高級中等學校名錄 — Dataset #6089
 *
 * Note: These datasets use direct JSON file downloads from stats.moe.gov.tw
 * rather than the data.gov.tw datastore API.
 */
export const UNIVERSITY_URL = 'https://stats.moe.gov.tw/files/opendata/u1_new.json';
export const JUNIOR_HIGH_URL = 'https://stats.moe.gov.tw/files/opendata/j1_new.json';
export const HIGH_SCHOOL_URL = 'https://stats.moe.gov.tw/files/school/114/high.json';

function extractCity(raw: string): string {
  // Some datasets prefix city with code like "[01]新北市"
  const match = raw.match(/\[\d+\](.+)/);
  return match ? match[1] : raw;
}

function normalizeUniversity(r: UniversityRecord): SchoolRecord {
  return {
    name: r['學校名稱'],
    code: r['代碼'],
    level: '大專校院',
    publicPrivate: r['公/私立'],
    city: extractCity(r['縣市名稱']),
    address: r['地址'],
    phone: r['電話'],
    website: r['網址'],
  };
}

function normalizeJuniorHigh(r: JuniorHighRecord): SchoolRecord {
  return {
    name: r['學校名稱'],
    code: r['代碼'],
    level: '國民中學',
    publicPrivate: r['公/私立'],
    city: extractCity(r['縣市名稱']),
    address: r['地址'],
    phone: r['電話'],
    website: r['網址'],
  };
}

function normalizeHighSchool(r: HighSchoolRecord): SchoolRecord {
  return {
    name: r['學校名稱'],
    code: r['代碼'],
    level: '高級中等學校',
    publicPrivate: r['公/私立'],
    city: extractCity(r['縣市名稱']),
    address: r['地址'],
    phone: r['電話'],
    website: r['網址'],
  };
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MOE API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('MOE API returned unexpected format (expected array)');
  }
  return data as T[];
}

export async function fetchUniversities(params?: {
  keyword?: string;
  city?: string;
  type?: string;
}): Promise<SchoolRecord[]> {
  const raw = await fetchJson<UniversityRecord>(UNIVERSITY_URL);
  let records = raw.map(normalizeUniversity);

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    records = records.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.address.toLowerCase().includes(kw)
    );
  }

  if (params?.city) {
    const city = params.city;
    records = records.filter((r) => r.city.includes(city));
  }

  if (params?.type) {
    const t = params.type;
    records = records.filter(
      (r) => r.publicPrivate.includes(t) || r.name.includes(t)
    );
  }

  return records;
}

export async function fetchJuniorHighSchools(params?: {
  keyword?: string;
  city?: string;
}): Promise<SchoolRecord[]> {
  const raw = await fetchJson<JuniorHighRecord>(JUNIOR_HIGH_URL);
  let records = raw.map(normalizeJuniorHigh);

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    records = records.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.address.toLowerCase().includes(kw)
    );
  }

  if (params?.city) {
    const city = params.city;
    records = records.filter((r) => r.city.includes(city));
  }

  return records;
}

export async function fetchHighSchools(params?: {
  keyword?: string;
  city?: string;
}): Promise<SchoolRecord[]> {
  const raw = await fetchJson<HighSchoolRecord>(HIGH_SCHOOL_URL);
  let records = raw.map(normalizeHighSchool);

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    records = records.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.address.toLowerCase().includes(kw)
    );
  }

  if (params?.city) {
    const city = params.city;
    records = records.filter((r) => r.city.includes(city));
  }

  return records;
}

export async function fetchAllSchools(params?: {
  keyword?: string;
  city?: string;
  level?: string;
}): Promise<SchoolRecord[]> {
  const [universities, juniorHighs, highSchools] = await Promise.all([
    fetchUniversities({ keyword: params?.keyword, city: params?.city }),
    fetchJuniorHighSchools({ keyword: params?.keyword, city: params?.city }),
    fetchHighSchools({ keyword: params?.keyword, city: params?.city }),
  ]);

  let all = [...universities, ...juniorHighs, ...highSchools];

  if (params?.level) {
    const level = params.level;
    all = all.filter((r) => r.level.includes(level));
  }

  return all;
}
