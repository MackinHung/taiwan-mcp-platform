import type { Env, AgriProduct } from './types.js';

const MOA_BASE = 'https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx';

export function buildUrl(params?: {
  format?: string;
  top?: number;
  filter?: string;
  apiKey?: string;
}): string {
  const url = new URL(MOA_BASE);
  url.searchParams.set('$format', params?.format ?? 'json');
  if (params?.top) url.searchParams.set('$top', String(params.top));
  if (params?.filter) url.searchParams.set('$filter', params.filter);
  if (params?.apiKey) url.searchParams.set('api_key', params.apiKey);
  return url.toString();
}

export async function fetchProducts(
  env: Env,
  params?: { top?: number; filter?: string }
): Promise<AgriProduct[]> {
  const url = buildUrl({
    top: params?.top,
    filter: params?.filter,
    apiKey: env.MOA_API_KEY,
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MOA API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AgriProduct[];

  if (!Array.isArray(data)) {
    throw new Error('MOA API returned unexpected format');
  }

  return data;
}

// Filter types for vegetable vs fruit
export const VEGETABLE_TYPES = ['蔬菜', 'LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH'];
export const FRUIT_TYPES = ['水果', 'FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG'];

export function isVegetable(product: AgriProduct): boolean {
  const typeName = product['種類名稱'] ?? '';
  const typeCode = product['種類代碼'] ?? '';
  return (
    typeName.includes('蔬菜') ||
    typeName.includes('葉菜') ||
    typeName.includes('根莖') ||
    typeName.includes('花菜') ||
    typeCode.startsWith('L') ||
    // Common vegetables by name when type info is absent
    /菜|瓜|豆|蘿蔔|蔥|蒜|薑|芹|筍|茄/.test(product['作物名稱'] ?? '')
  );
}

export function isFruit(product: AgriProduct): boolean {
  const typeName = product['種類名稱'] ?? '';
  const typeCode = product['種類代碼'] ?? '';
  return (
    typeName.includes('水果') ||
    typeName.includes('果') ||
    typeCode.startsWith('F') ||
    // Common fruits by name when type info is absent
    /蕉|梨|蘋果|柑|橘|芒果|鳳梨|荔枝|龍眼|葡萄|西瓜|木瓜|芭樂|棗|柿|桃|梅|李|櫻桃/.test(product['作物名稱'] ?? '')
  );
}
