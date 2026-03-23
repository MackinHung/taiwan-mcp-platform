import type { LocalAnnouncement } from '../types.js';

interface TaichungApiResponse {
  title: string;
  content: string | null;
  publishDate: string;
  category: string | null;
  unit: string | null;
  url: string | null;
}

/**
 * Get the Taichung Open Data API endpoint URL
 *
 * NOTE: This is a placeholder URL. The actual Taichung City Government
 * announcements API endpoint needs to be updated once found.
 *
 * Attempted searches:
 * - https://opendata.taichung.gov.tw/ (no specific news dataset found)
 * - https://www.taichung.gov.tw/ (mentions RSS/API but no direct endpoint)
 * - https://data.gov.tw/ (no Taichung city news dataset found)
 *
 * When the actual endpoint is discovered, update this URL.
 * Expected format: https://opendata.taichung.gov.tw/dataset/{id}/resource/{rid}/download
 */
export function getApiUrl(): string {
  // Placeholder - to be replaced with actual API endpoint when discovered
  return 'https://opendata.taichung.gov.tw/api/news/announcements';
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string | null): string {
  if (!html) return '';

  // Remove HTML tags and decode common entities
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up extra whitespace
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n');

  return text.trim();
}

/**
 * Normalize various date formats to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  // Remove extra whitespace
  const cleaned = dateStr.trim();

  // Handle ROC (Taiwan) calendar year format: 113/03/15 -> 2024-03-15
  const rocMatch = cleaned.match(/^(\d{3})\/(\d{1,2})\/(\d{1,2})/);
  if (rocMatch) {
    const rocYear = parseInt(rocMatch[1], 10);
    const gregorianYear = rocYear + 1911;
    const month = rocMatch[2].padStart(2, '0');
    const day = rocMatch[3].padStart(2, '0');
    return `${gregorianYear}-${month}-${day}`;
  }

  // Handle slash format: 2024/03/15 or 2024/03/15 10:30
  const slashMatch = cleaned.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const year = slashMatch[1];
    const month = slashMatch[2].padStart(2, '0');
    const day = slashMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle ISO format: 2024-03-01T10:30:00
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Handle already normalized format: 2024-03-01
  const normalizedMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (normalizedMatch) {
    return cleaned;
  }

  // Try to parse as Date object (fallback)
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Ignore parsing errors
  }

  // Return as-is if cannot parse
  return cleaned;
}

/**
 * Fetch announcements from Taichung City Government
 */
export async function fetchTaichungAnnouncements(): Promise<LocalAnnouncement[]> {
  try {
    const response = await fetch(getApiUrl());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      throw new Error('API response is not an array');
    }

    // Map API response to LocalAnnouncement
    const announcements: LocalAnnouncement[] = data.map((item: TaichungApiResponse) => {
      return {
        title: item.title || '',
        date: normalizeDate(item.publishDate),
        content: stripHtml(item.content),
        city: 'taichung' as const,
        agency: item.unit?.trim() || '',
        category: item.category?.trim() || '',
        url: item.url?.trim() || '',
      };
    });

    return announcements;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch Taichung announcements: ${String(error)}`);
  }
}
