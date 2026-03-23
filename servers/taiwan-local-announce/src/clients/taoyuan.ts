import type { LocalAnnouncement } from '../types.js';

const API_URL =
  'https://data.tycg.gov.tw/opendata/datalist/datasetMeta/download?id=81ac9cd3-bce7-4e62-8134-ac89dc54ef3e&rid=73644460-c76f-4afa-aa30-064bfef291d8';

interface TaoyuanAnnouncementRaw {
  title?: string;
  標題?: string;
  content?: string | null;
  內容?: string | null;
  description?: string | null;
  publishDate?: string;
  日期?: string;
  pubDate?: string;
  category?: string | null;
  分類?: string | null;
  type?: string | null;
  unit?: string;
  發布單位?: string;
  source?: string;
  url?: string;
  link?: string;
}

/**
 * Get the Taoyuan API URL for announcements
 */
export function getApiUrl(): string {
  return API_URL;
}

/**
 * Strip HTML tags from text and normalize whitespace
 */
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Replace block-level tags with newlines before removing them
  let text = html
    .replace(/<\/?(p|div|h[1-6]|br|li|tr)[^>]*>/gi, '\n')
    .replace(/<\/?(td|th)[^>]*>/gi, ' ');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace while preserving intentional line breaks
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return text;
}

/**
 * Normalize date to YYYY-MM-DD format
 * Handles multiple formats:
 * - YYYY-MM-DD
 * - YYYY/MM/DD HH:mm
 * - YYYY-MM-DDTHH:mm:ss
 * - YYY/MM/DD (ROC year format, e.g., 113/03/25)
 */
function normalizeDate(dateStr: string | undefined): string {
  if (!dateStr) return '';

  // Remove time portion if present
  const datePart = dateStr.split('T')[0].split(' ')[0];

  // Handle ROC year format (e.g., 113/03/25 -> 2024-03-25)
  if (/^\d{3}\/\d{2}\/\d{2}$/.test(datePart)) {
    const [rocYear, month, day] = datePart.split('/');
    const adYear = parseInt(rocYear, 10) + 1911;
    return `${adYear}-${month}-${day}`;
  }

  // Convert slashes to hyphens
  const normalized = datePart.replace(/\//g, '-');

  // Validate YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  return '';
}

/**
 * Map a raw Taoyuan announcement to the LocalAnnouncement interface
 */
function mapAnnouncement(raw: TaoyuanAnnouncementRaw): LocalAnnouncement {
  // Handle field name variants
  const title = raw.title || raw.標題 || '';
  const content = raw.content || raw.內容 || raw.description || '';
  const dateRaw = raw.publishDate || raw.日期 || raw.pubDate || '';
  const category = raw.category || raw.分類 || raw.type || '';
  const agency = raw.unit || raw.發布單位 || raw.source || '';
  const url = raw.url || raw.link || '';

  return {
    title,
    date: normalizeDate(dateRaw),
    content: stripHtml(content),
    city: 'taoyuan',
    agency,
    category: category || '',
    url,
  };
}

/**
 * Fetch announcements from Taoyuan City Government
 */
export async function fetchTaoyuanAnnouncements(): Promise<LocalAnnouncement[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Taoyuan announcements: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid response format: expected an array');
  }

  return data.map(mapAnnouncement);
}
