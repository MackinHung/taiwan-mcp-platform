import type { CompanyBasic, CompanyWithBusiness, DirectorRecord } from './types.js';

const BASE_URL = 'https://data.gcis.nat.gov.tw/od/data/api';

export const DATASET_IDS = {
  companyBasic: '5F64D864-61CB-4D0D-8AD9-492047CC1EA6',
  companySearch: '6BBA2268-1367-4B42-9CCA-BC17499EBE8C',
  companyBusiness: '236EE382-4942-41A9-BD03-CA0709025E7C',
  directors: '4E5F7653-1B91-4DDC-99D5-468530FAE396',
  taxIdVerify: '673F0FC0-B3A7-429F-9041-E9866836B66D',
} as const;

export const COMPANY_STATUS: Record<string, string> = {
  '01': '核准設立',
  '02': '停業',
  '03': '解散/撤銷',
  '04': '申覆(辯)期',
  '05': '遷他縣市',
  '06': '列入廢止中',
  '07': '廢止',
  '08': '破產',
};

async function fetchGcis<T>(
  datasetId: string,
  filter: string,
  top: number = 50
): Promise<T[]> {
  const params = new URLSearchParams({
    $format: 'json',
    $filter: filter,
    $skip: '0',
    $top: String(Math.min(top, 1000)),
  });

  const url = `${BASE_URL}/${datasetId}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GCIS API error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data as T[];
}

export async function lookupByTaxId(taxId: string): Promise<CompanyBasic[]> {
  return fetchGcis<CompanyBasic>(
    DATASET_IDS.companyBasic,
    `Business_Accounting_NO eq ${taxId}`
  );
}

export async function searchByName(
  name: string,
  statusCode: string = '01',
  top: number = 20
): Promise<CompanyBasic[]> {
  const filter = `Company_Name like ${name} and Company_Status eq ${statusCode}`;
  return fetchGcis<CompanyBasic>(DATASET_IDS.companySearch, filter, top);
}

export async function getBusinessItems(taxId: string): Promise<CompanyWithBusiness[]> {
  return fetchGcis<CompanyWithBusiness>(
    DATASET_IDS.companyBusiness,
    `Business_Accounting_NO eq ${taxId}`
  );
}

export async function getDirectors(taxId: string): Promise<DirectorRecord[]> {
  return fetchGcis<DirectorRecord>(
    DATASET_IDS.directors,
    `Business_Accounting_NO eq ${taxId}`
  );
}

export function formatRocDate(rocDate: string): string {
  if (!rocDate || rocDate.length < 7) return rocDate || '（無資料）';
  const year = parseInt(rocDate.substring(0, 3), 10) + 1911;
  const month = rocDate.substring(3, 5);
  const day = rocDate.substring(5, 7);
  return `${year}/${month}/${day}`;
}

export function formatCapital(amount: number): string {
  if (!amount || amount <= 0) return '（無資料）';
  if (amount >= 1_0000_0000) {
    return `${(amount / 1_0000_0000).toFixed(1)} 億元`;
  }
  if (amount >= 1_0000) {
    return `${(amount / 1_0000).toFixed(0)} 萬元`;
  }
  return `${amount} 元`;
}
