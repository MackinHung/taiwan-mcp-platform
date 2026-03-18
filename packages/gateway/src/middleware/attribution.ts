import { createMiddleware } from 'hono/factory';
import type { Env } from '../env.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

/**
 * Government agency attribution — ASCII-safe header values.
 * HTTP headers only support ASCII (ByteString), so we use English abbreviations.
 */
export const ATTRIBUTION_HEADER_MAP: Readonly<Record<string, string>> = {
  'taiwan-weather': 'CWA (Central Weather Administration)',
  'taiwan-air-quality': 'MOENV (Ministry of Environment)',
  'taiwan-electricity': 'Taipower',
  'taiwan-stock': 'TWSE (Taiwan Stock Exchange)',
  'taiwan-news': 'RSS Media Sources',
  'taiwan-hospital': 'NHI (National Health Insurance)',
  'taiwan-company': 'GCIS (Dept. of Commerce)',
  'taiwan-transit': 'TDX (Transport Data Exchange)',
  'taiwan-exchange-rate': 'BOT (Central Bank)',
  'taiwan-food-safety': 'FDA (Food and Drug Administration)',
  'taiwan-weather-alert': 'CWA (Central Weather Administration)',
  'taiwan-invoice': 'MOF E-Invoice Platform',
  'taiwan-budget': 'Government Open Data Platform',
  'taiwan-tax': 'MOF (Ministry of Finance)',
  'taiwan-labor': 'MOL (Ministry of Labor)',
  'taiwan-patent': 'TIPO (IP Office)',
  'taiwan-customs': 'Customs Administration',
};

/**
 * Full Chinese+English display names for UI rendering.
 * Used by server detail pages and composition views.
 */
export const ATTRIBUTION_DISPLAY_MAP: Readonly<Record<string, string>> = {
  'taiwan-weather': '中央氣象署 (CWA)',
  'taiwan-air-quality': '環境部 (MOENV)',
  'taiwan-electricity': '台灣電力公司 (Taipower)',
  'taiwan-stock': '台灣證券交易所 (TWSE)',
  'taiwan-news': '各媒體 RSS 來源',
  'taiwan-hospital': '衛生福利部中央健康保險署 (NHI)',
  'taiwan-company': '經濟部商業司 (GCIS)',
  'taiwan-transit': '交通部運輸資料流通服務 (TDX)',
  'taiwan-exchange-rate': '中央銀行 (BOT)',
  'taiwan-food-safety': '食品藥物管理署 (FDA)',
  'taiwan-weather-alert': '中央氣象署 (CWA)',
  'taiwan-invoice': '財政部電子發票平台',
  'taiwan-budget': '政府資料開放平臺',
  'taiwan-tax': '財政部',
  'taiwan-labor': '勞動部',
  'taiwan-patent': '智慧財產局 (TIPO)',
  'taiwan-customs': '財政部關務署',
};

/** Default data license for Taiwan government open data (ASCII) */
export const DEFAULT_DATA_LICENSE = 'Taiwan Government Open Data License';

/**
 * Extract server slug from the request path.
 * Matches patterns like /api/mcp/{slug}/... or /api/servers/{slug}/...
 */
export function extractServerSlug(path: string): string | null {
  const match = path.match(/\/api\/(?:mcp|servers|compositions)\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Data attribution middleware.
 * Adds X-Data-Source, X-Data-License, X-Data-Updated headers (ASCII-safe)
 * to responses when the request targets a known MCP server.
 */
export function attributionMiddleware() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    await next();

    const slug = extractServerSlug(c.req.path);
    if (!slug) return;

    const source = ATTRIBUTION_HEADER_MAP[slug];
    if (!source) return;

    c.header('X-Data-Source', source);
    c.header('X-Data-License', DEFAULT_DATA_LICENSE);
    c.header('X-Data-Updated', new Date().toISOString());
  });
}
