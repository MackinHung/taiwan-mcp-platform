// ============================================================
// Cache TTL Configuration — PII-aware per-server settings
// ============================================================
// Servers containing personal data (names, etc.) get shorter TTLs
// to comply with Taiwan PDPA 2025 amendments.

/** Default TTL for servers without explicit config (24 hours) */
export const DEFAULT_CACHE_TTL = 86400;

/**
 * Per-server cache TTL in seconds.
 * Servers with PII content have shorter TTLs marked with comments.
 */
export const CACHE_TTL: Readonly<Record<string, number>> = {
  // === No PII — standard TTL ===
  'taiwan-weather': 3600,          // 1h (weather changes frequently)
  'taiwan-air-quality': 1800,      // 30min
  'taiwan-electricity': 3600,      // 1h
  'taiwan-stock': 300,             // 5min (market data, real-time)
  'taiwan-transit': 600,           // 10min
  'taiwan-exchange-rate': 3600,    // 1h
  'taiwan-food-safety': 86400,    // 24h
  'taiwan-weather-alert': 300,     // 5min (emergency alerts)
  'taiwan-invoice': 86400,        // 24h
  'taiwan-budget': 86400,         // 24h
  'taiwan-tax': 86400,            // 24h
  'taiwan-labor': 86400,          // 24h
  'taiwan-customs': 86400,        // 24h

  // === Contains PII — restricted TTL ===
  'taiwan-news': 21600,           // 6h  (journalist/interviewee names)
  'taiwan-company': 43200,        // 12h (company representative names)
  'taiwan-hospital': 43200,       // 12h (doctor names)
  'taiwan-patent': 86400,         // 24h (inventor names)
};

/** PII risk classification per server */
export type PiiRisk = 'none' | 'low' | 'medium';

export const PII_RISK: Readonly<Record<string, PiiRisk>> = {
  'taiwan-news': 'medium',
  'taiwan-company': 'medium',
  'taiwan-hospital': 'medium',
  'taiwan-patent': 'low',
};

/**
 * Get cache TTL for a given server slug.
 * Returns the configured TTL or the default (24h).
 */
export function getCacheTtl(serverSlug: string): number {
  return CACHE_TTL[serverSlug] ?? DEFAULT_CACHE_TTL;
}

/**
 * Check if a server contains PII data.
 */
export function hasPiiData(serverSlug: string): boolean {
  return serverSlug in PII_RISK;
}
