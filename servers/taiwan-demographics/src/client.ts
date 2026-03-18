import type { OpenDataResponse } from './types.js';

const API_BASE = 'https://www.ris.gov.tw/rs-opendata/api/v1/datastore';

// Dataset IDs
export const DATASET_POPULATION = 'ODRP010';
export const DATASET_AGE_DISTRIBUTION = 'ODRP049';
export const DATASET_VITAL_STATS = 'ODRP024';

export function getDefaultYyyymm(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

export function buildUrl(
  dataset: string,
  yyyymm: string,
  params?: Record<string, string>
): string {
  const url = new URL(`${API_BASE}/${dataset}/${yyyymm}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function fetchData(
  dataset: string,
  yyyymm: string,
  county?: string
): Promise<Record<string, string>[]> {
  const params: Record<string, string> = {};
  if (county) {
    params.COUNTY = county;
  }

  const url = buildUrl(dataset, yyyymm, params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`RIS API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenDataResponse;

  if (data.responseMsg && data.responseMsg !== 'success' && data.responseMsg !== '') {
    // Some error messages from the API
    if (!data.responseData || (Array.isArray(data.responseData) && data.responseData.length === 0)) {
      throw new Error(`RIS API: ${data.responseMsg}`);
    }
  }

  if (!data.responseData || !Array.isArray(data.responseData)) {
    return [];
  }

  return data.responseData as Record<string, string>[];
}

export async function fetchPopulation(
  yyyymm: string,
  county?: string
): Promise<Record<string, string>[]> {
  return fetchData(DATASET_POPULATION, yyyymm, county);
}

export async function fetchAgeDistribution(
  yyyymm: string,
  county?: string
): Promise<Record<string, string>[]> {
  return fetchData(DATASET_AGE_DISTRIBUTION, yyyymm, county);
}

export async function fetchVitalStats(
  yyyymm: string,
  county?: string
): Promise<Record<string, string>[]> {
  return fetchData(DATASET_VITAL_STATS, yyyymm, county);
}
