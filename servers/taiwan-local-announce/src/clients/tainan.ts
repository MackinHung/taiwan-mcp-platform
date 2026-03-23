import type { LocalAnnouncement } from '../types.js';

interface TainanApiResponse {
  Title: string;
  Content: string | null;
  PubDate: string;
  Category1: string | null;
  Author: string | null;
  Link: string | null;
  // Chinese field name fallbacks
  標題?: string;
  內容?: string;
  發布日期?: string;
  分類?: string;
  發布單位?: string;
  連結?: string;
}

/**
 * Get the Tainan Open Data API endpoint URL
 * Using City Government News feed (市政府新聞)
 *
 * NOTE: As of 2026-03-23, the actual endpoint returns RSS/XML format, not JSON.
 * This implementation is designed for a JSON API that would have the same data structure.
 * Possible solutions for production:
 * 1. Contact Tainan city government to request a JSON endpoint
 * 2. Use a middleware service to convert RSS to JSON
 * 3. Implement RSS/XML parsing (requires additional dependencies)
 *
 * Reference RSS feed: https://www.tainan.gov.tw/OpenData.aspx?SN=24474215983F6554
 */
export function getApiUrl(): string {
  return 'https://www.tainan.gov.tw/OpenData.aspx?SN=24474215983F6554';
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
function normalizeDate(dateStr: string | null): string {
  if (!dateStr) {
    // Return current date if date is missing
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

  // Handle dot format: 2024.03.15
  const dotMatch = cleaned.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (dotMatch) {
    const year = dotMatch[1];
    const month = dotMatch[2].padStart(2, '0');
    const day = dotMatch[3].padStart(2, '0');
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

  // Return current date as fallback
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get field value with fallback to multiple field name variants
 */
function getField(
  record: TainanApiResponse,
  englishField: keyof TainanApiResponse,
  chineseField?: keyof TainanApiResponse
): string {
  // Try English field first
  const englishValue = record[englishField];
  if (englishValue !== null && englishValue !== undefined && englishValue !== '') {
    return String(englishValue).trim();
  }

  // Try Chinese field if provided
  if (chineseField) {
    const chineseValue = record[chineseField];
    if (chineseValue !== null && chineseValue !== undefined && chineseValue !== '') {
      return String(chineseValue).trim();
    }
  }

  return '';
}

/**
 * Fetch announcements from Tainan City Government
 */
export async function fetchTainanAnnouncements(): Promise<LocalAnnouncement[]> {
  try {
    const response = await fetch(getApiUrl());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      throw new Error('API response is not an array');
    }

    // Map API response to LocalAnnouncement
    const announcements: LocalAnnouncement[] = data.map((item: TainanApiResponse) => {
      const title = getField(item, 'Title', '標題');
      const content = getField(item, 'Content', '內容');
      const dateStr = getField(item, 'PubDate', '發布日期');
      const category = getField(item, 'Category1', '分類');
      const agency = getField(item, 'Author', '發布單位');
      const url = getField(item, 'Link', '連結');

      return {
        title,
        date: normalizeDate(dateStr || null),
        content: stripHtml(content || null),
        city: 'tainan' as const,
        agency,
        category,
        url,
      };
    });

    return announcements;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch Tainan announcements: ${String(error)}`);
  }
}
