import type { LocalAnnouncement } from '../types.js';

const API_URL =
  'https://data.ntpc.gov.tw/api/datasets/10a52726-1bd2-4721-81d0-bb25ce01ea37/rawdata?size=100';

/**
 * Get the API URL for New Taipei announcements
 */
export function getApiUrl(): string {
  return API_URL;
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string | null | undefined): string {
  if (!dateStr) {
    // Return current date if date is missing
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Extract date part (remove time if present)
  const datePart = dateStr.split('T')[0];

  // Replace separators with hyphens
  const normalized = datePart.replace(/[/.]/g, '-');

  return normalized;
}

/**
 * Get field value with fallback to multiple field name variants
 */
function getField(
  record: any,
  variants: string[]
): string {
  for (const variant of variants) {
    const value = record[variant];
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }
  return '';
}

/**
 * Fetch announcements from New Taipei City Open Data API
 */
export async function fetchNewtaipeiAnnouncements(): Promise<LocalAnnouncement[]> {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('API 回應格式錯誤');
    }

    const announcements: LocalAnnouncement[] = data.map((record) => {
      const title = getField(record, ['title', '標題']);
      const content = getField(record, ['content', '內容']);
      const dateStr = getField(record, ['publishDate', '發佈日期', 'date']);
      const category = getField(record, ['category', '分類']);
      const agency = getField(record, ['unit', '發布單位', '機關']);
      const url = getField(record, ['url', 'link', '連結']);

      return {
        title,
        date: normalizeDate(dateStr || null),
        content: content ? stripHtml(content) : '',
        city: 'newtaipei',
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
    throw new Error('未知錯誤');
  }
}
