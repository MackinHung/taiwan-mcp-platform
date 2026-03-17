import type { ExchangeRate } from './types.js';

const BOT_BASE = 'https://rate.bot.com.tw/xrt';

export function buildUrl(date?: string): string {
  if (date) {
    return `${BOT_BASE}/flcsv/0/${date}`;
  }
  return `${BOT_BASE}/flcsv/0/day`;
}

export function parseCsv(csvText: string): ExchangeRate[] {
  const lines = csvText.trim().split('\n');
  // Skip header row
  const rates: ExchangeRate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;

    // Extract currency code from description like "美金 (USD)"
    const match = cols[0].trim().match(/\((\w+)\)/);
    const currencyCode = match ? match[1] : cols[0].trim();
    const currency = cols[0].trim().replace(/\s*\(\w+\)/, '');

    rates.push({
      currency,
      currencyCode,
      cashBuying: cols[1]?.trim() || '-',
      cashSelling: cols[2]?.trim() || '-',
      spotBuying: cols[3]?.trim() || '-',
      spotSelling: cols[4]?.trim() || '-',
    });
  }

  return rates;
}

export async function fetchRates(date?: string): Promise<ExchangeRate[]> {
  const url = buildUrl(date);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`BOT API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return parseCsv(text);
}
