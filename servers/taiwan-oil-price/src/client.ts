import type { FuelPrice, FuelTypeCode, PriceChange, PriceHistoryRecord } from './types.js';

// CPC open data endpoint (JSON attempt)
const CPC_API_URL = 'https://vipmbr.cpc.com.tw/opendata/v1/ListPrice1';

/**
 * Fuel type mapping: code → Chinese name
 */
export const FUEL_TYPES: Record<FuelTypeCode, string> = {
  '92': '92無鉛汽油',
  '95': '95無鉛汽油',
  '98': '98無鉛汽油',
  diesel: '超級柴油',
} as const;

/**
 * CPC product code → our fuel type code mapping
 */
const PROD_CODE_MAP: Record<string, FuelTypeCode> = {
  '1': '92',
  '2': '95',
  '3': '98',
  '4': 'diesel',
};

/**
 * Fallback prices (recent data as of 2026-03)
 * Used when CPC API is unavailable
 */
const FALLBACK_PRICES: readonly FuelPrice[] = [
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.5, unit: '元/公升', effectiveDate: '2026-03-17' },
  { fuelType: '95', fuelName: '95無鉛汽油', price: 31.0, unit: '元/公升', effectiveDate: '2026-03-17' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 33.0, unit: '元/公升', effectiveDate: '2026-03-17' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 28.2, unit: '元/公升', effectiveDate: '2026-03-17' },
] as const;

/**
 * Fallback previous prices (for price change calculation)
 */
const FALLBACK_PREVIOUS_PRICES: readonly FuelPrice[] = [
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.3, unit: '元/公升', effectiveDate: '2026-03-10' },
  { fuelType: '95', fuelName: '95無鉛汽油', price: 30.8, unit: '元/公升', effectiveDate: '2026-03-10' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 32.8, unit: '元/公升', effectiveDate: '2026-03-10' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 28.0, unit: '元/公升', effectiveDate: '2026-03-10' },
] as const;

/**
 * Fallback price history (recent weekly data)
 */
const FALLBACK_HISTORY: readonly PriceHistoryRecord[] = [
  { fuelType: '95', fuelName: '95無鉛汽油', price: 31.0, effectiveDate: '2026-03-17' },
  { fuelType: '95', fuelName: '95無鉛汽油', price: 30.8, effectiveDate: '2026-03-10' },
  { fuelType: '95', fuelName: '95無鉛汽油', price: 30.5, effectiveDate: '2026-03-03' },
  { fuelType: '95', fuelName: '95無鉛汽油', price: 30.9, effectiveDate: '2026-02-24' },
  { fuelType: '95', fuelName: '95無鉛汽油', price: 31.2, effectiveDate: '2026-02-17' },
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.5, effectiveDate: '2026-03-17' },
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.3, effectiveDate: '2026-03-10' },
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.0, effectiveDate: '2026-03-03' },
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.4, effectiveDate: '2026-02-24' },
  { fuelType: '92', fuelName: '92無鉛汽油', price: 29.7, effectiveDate: '2026-02-17' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 33.0, effectiveDate: '2026-03-17' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 32.8, effectiveDate: '2026-03-10' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 32.5, effectiveDate: '2026-03-03' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 32.9, effectiveDate: '2026-02-24' },
  { fuelType: '98', fuelName: '98無鉛汽油', price: 33.2, effectiveDate: '2026-02-17' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 28.2, effectiveDate: '2026-03-17' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 28.0, effectiveDate: '2026-03-10' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 27.7, effectiveDate: '2026-03-03' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 28.1, effectiveDate: '2026-02-24' },
  { fuelType: 'diesel', fuelName: '超級柴油', price: 28.4, effectiveDate: '2026-02-17' },
] as const;

/**
 * Validate fuel type code
 */
export function isValidFuelType(type: string): type is FuelTypeCode {
  return type === '92' || type === '95' || type === '98' || type === 'diesel';
}

/**
 * Parse CPC API response into FuelPrice array
 */
function parseCpcResponse(data: unknown): FuelPrice[] | null {
  try {
    const response = data as {
      UpdateTime?: string;
      PriceUpdate?: Array<{
        ProdCode?: string;
        ProdName?: string;
        Price?: string;
        EffectiveDate?: string;
      }>;
    };

    if (!response?.PriceUpdate || !Array.isArray(response.PriceUpdate)) {
      return null;
    }

    const prices: FuelPrice[] = [];
    for (const item of response.PriceUpdate) {
      const code = item.ProdCode;
      const fuelType = code ? PROD_CODE_MAP[code] : undefined;
      if (!fuelType || !item.Price) continue;

      prices.push({
        fuelType,
        fuelName: FUEL_TYPES[fuelType],
        price: parseFloat(item.Price),
        unit: '元/公升',
        effectiveDate: item.EffectiveDate ?? response.UpdateTime ?? 'unknown',
      });
    }

    return prices.length > 0 ? prices : null;
  } catch {
    return null;
  }
}

/**
 * Fetch current fuel prices from CPC API with fallback
 */
export async function fetchCurrentPrices(): Promise<{
  prices: FuelPrice[];
  source: 'api' | 'fallback';
}> {
  try {
    const response = await fetch(CPC_API_URL);
    if (!response.ok) {
      throw new Error(`CPC API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const prices = parseCpcResponse(data);
    if (prices) {
      return { prices, source: 'api' };
    }

    throw new Error('Invalid CPC API response format');
  } catch {
    // Use fallback prices when API is unavailable
    return { prices: [...FALLBACK_PRICES], source: 'fallback' };
  }
}

/**
 * Fetch price changes (current vs previous week)
 */
export async function fetchPriceChanges(): Promise<{
  changes: PriceChange[];
  source: 'api' | 'fallback';
}> {
  // For now, use fallback data; real-time requires SOAP parsing or storing history
  const currentPrices = FALLBACK_PRICES;
  const previousPrices = FALLBACK_PREVIOUS_PRICES;

  const changes: PriceChange[] = currentPrices.map((current) => {
    const previous = previousPrices.find((p) => p.fuelType === current.fuelType);
    return {
      fuelType: current.fuelType,
      fuelName: current.fuelName,
      previousPrice: previous?.price ?? current.price,
      currentPrice: current.price,
      change: current.price - (previous?.price ?? current.price),
      effectiveDate: current.effectiveDate,
    };
  });

  return { changes, source: 'fallback' };
}

/**
 * Fetch price history records
 */
export async function fetchPriceHistory(
  fuelType?: FuelTypeCode,
  limit: number = 10
): Promise<{
  records: PriceHistoryRecord[];
  source: 'api' | 'fallback';
}> {
  // Use fallback history data; real-time history requires SOAP or database
  let records = [...FALLBACK_HISTORY];

  if (fuelType) {
    records = records.filter((r) => r.fuelType === fuelType);
  }

  // Sort by date descending
  records.sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );

  return {
    records: records.slice(0, limit),
    source: 'fallback',
  };
}
