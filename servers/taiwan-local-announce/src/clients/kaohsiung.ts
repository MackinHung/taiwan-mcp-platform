import type { LocalAnnouncement } from '../types.js';

interface KaohsiungApiItem {
  title: string;
  link: string;
  description: string | null;
  pubDate: string;
  'dc:title'?: string;
  'dc:creator'?: string;
  'dc:subject'?: string;
  'dc:contributor'?: string;
  'dc:source'?: string;
  'dc:publisher'?: string;
  'dc:identifier'?: string;
  'category.theme'?: string;
  'category.cake'?: string;
  keywords?: string;
}

interface KaohsiungApiResponse {
  contentType: string;
  isImage: boolean;
  data: KaohsiungApiItem[];
}

/**
 * Get the Kaohsiung Open Data API endpoint URL
 */
export function getApiUrl(): string {
  return 'https://api.kcg.gov.tw/api/service/get/320cf361-edb1-4383-81fc-b9527b301da7';
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
 * Normalize date format from YYYY/M/D HH:MM:SS to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  // Remove extra whitespace
  const cleaned = dateStr.trim();

  // Handle Kaohsiung format: 2024/3/15 10:30:00 or 2024/12/1 14:00:00
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
 * Fetch announcements from Kaohsiung City Government
 */
export async function fetchKaohsiungAnnouncements(): Promise<LocalAnnouncement[]> {
  try {
    const response = await fetch(getApiUrl());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const apiResponse = await response.json() as KaohsiungApiResponse;

    // Validate response has data field
    if (!apiResponse.data) {
      throw new Error('API response missing data array');
    }

    // Validate data is an array
    if (!Array.isArray(apiResponse.data)) {
      throw new Error('API response data is not an array');
    }

    const data: KaohsiungApiItem[] = apiResponse.data;

    // Map API response to LocalAnnouncement
    const announcements: LocalAnnouncement[] = data.map((item: KaohsiungApiItem) => {
      // Extract agency from dc:contributor or fallback to dc:source
      const agency = item['dc:contributor']?.trim() || item['dc:source']?.trim() || '';

      // Extract category from dc:subject or fallback to category.theme
      const category = item['dc:subject']?.trim() || item['category.theme']?.trim() || '';

      return {
        title: item.title || '',
        date: normalizeDate(item.pubDate),
        content: stripHtml(item.description),
        city: 'kaohsiung' as const,
        agency,
        category,
        url: item.link?.trim() || '',
      };
    });

    return announcements;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch Kaohsiung announcements: ${String(error)}`);
  }
}
