import type {
  MarketSummary,
  MarketIndex,
  TopVolumeStock,
  StockValuation,
  StockDayAll,
} from './types.js';

const TWSE_BASE = 'https://openapi.twse.com.tw/v1';

export const ENDPOINTS = {
  MARKET_SUMMARY: '/exchangeReport/FMTQIK',
  MARKET_INDICES: '/exchangeReport/MI_INDEX',
  TOP_VOLUME: '/exchangeReport/MI_INDEX20',
  VALUATION: '/exchangeReport/BWIBBU_ALL',
  STOCK_DAY: '/exchangeReport/STOCK_DAY_ALL',
} as const;

async function fetchJson<T>(endpoint: string): Promise<T[]> {
  const url = `${TWSE_BASE}${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TWSE API error: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('TWSE API returned unexpected format');
  }
  return data as T[];
}

export async function fetchMarketSummary(): Promise<MarketSummary[]> {
  return fetchJson<MarketSummary>(ENDPOINTS.MARKET_SUMMARY);
}

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  return fetchJson<MarketIndex>(ENDPOINTS.MARKET_INDICES);
}

export async function fetchTopVolume(): Promise<TopVolumeStock[]> {
  return fetchJson<TopVolumeStock>(ENDPOINTS.TOP_VOLUME);
}

export async function fetchValuation(): Promise<StockValuation[]> {
  return fetchJson<StockValuation>(ENDPOINTS.VALUATION);
}

export async function fetchStockDayAll(): Promise<StockDayAll[]> {
  return fetchJson<StockDayAll>(ENDPOINTS.STOCK_DAY);
}
