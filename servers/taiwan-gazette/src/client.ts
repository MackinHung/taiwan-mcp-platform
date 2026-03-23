import type { GazetteRecord, SearchResult, GazetteDetail, DraftRegulation } from './types.js';

const BASE_URL = 'https://gazette.nat.gov.tw/egFront';
const XML_URL = `${BASE_URL}/OpenData/downloadXML.jsp`;
const SEARCH_URL = `${BASE_URL}/advancedSearchResult.do`;
const DETAIL_URL = `${BASE_URL}/detail.do`;
const DRAFT_URL = `${BASE_URL}/e_previewResult.do`;

export function getApiUrl(): string {
  return XML_URL;
}

function extractCdata(xml: string, tag: string): string {
  const pattern = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const match = xml.match(pattern);
  if (match) return match[1].trim();

  const simplePattern = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const simpleMatch = xml.match(simplePattern);
  return simpleMatch ? simpleMatch[1].trim() : '';
}

function parseRecord(recordXml: string): GazetteRecord {
  return {
    MetaId: extractCdata(recordXml, 'MetaId'),
    Doc_Style_LName: extractCdata(recordXml, 'Doc_Style_LName'),
    Doc_Style_SName: extractCdata(recordXml, 'Doc_Style_SName'),
    Chapter: extractCdata(recordXml, 'Chapter'),
    PubGovName: extractCdata(recordXml, 'PubGovName'),
    Date_Created: extractCdata(recordXml, 'Date_Created'),
    Date_Published: extractCdata(recordXml, 'Date_Published'),
    GazetteId: extractCdata(recordXml, 'GazetteId'),
    Title: extractCdata(recordXml, 'Title'),
    TitleEnglish: extractCdata(recordXml, 'TitleEnglish'),
    ThemeSubject: extractCdata(recordXml, 'ThemeSubject'),
    Keyword: extractCdata(recordXml, 'Keyword'),
    Explain: extractCdata(recordXml, 'Explain'),
    Category: extractCdata(recordXml, 'Category'),
    Comment_Deadline: extractCdata(recordXml, 'Comment_Deadline'),
    Comment_Days: extractCdata(recordXml, 'Comment_Days'),
  };
}

export function parseGazetteXml(xml: string): GazetteRecord[] {
  const records: GazetteRecord[] = [];
  const recordPattern = /<Record>([\s\S]*?)<\/Record>/gi;
  let match = recordPattern.exec(xml);
  while (match) {
    records.push(parseRecord(match[1]));
    match = recordPattern.exec(xml);
  }
  return records;
}

export async function fetchGazetteRecords(): Promise<GazetteRecord[]> {
  const response = await fetch(XML_URL);

  if (!response.ok) {
    throw new Error(`公報 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseGazetteXml(xml);
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').trim();
}

export function buildSearchUrl(params: {
  keyword?: string;
  chapter?: string;
  docType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): string {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('action', 'doQuery');
  if (params.keyword) url.searchParams.set('keyText1', params.keyword);
  if (params.chapter) url.searchParams.set('chapter', params.chapter);
  if (params.docType) url.searchParams.set('styleL', params.docType);
  if (params.startDate) url.searchParams.set('pubdateStart', params.startDate);
  if (params.endDate) url.searchParams.set('pubdateEnd', params.endDate);
  url.searchParams.set('pageNum', String(params.page ?? 1));
  url.searchParams.set('eachpage', String(params.pageSize ?? 10));
  return url.toString();
}

export function parseSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  // Match rows containing metaid links and gazette info
  const rowPattern = /metaid=(\d+)[^>]*>([^<]*)</gi;
  let match = rowPattern.exec(html);
  while (match) {
    const metaId = match[1];
    const title = stripHtmlTags(match[2]).trim();
    if (metaId && title) {
      results.push({
        MetaId: metaId,
        Title: title,
        PubGovName: '',
        Date_Published: '',
        Doc_Style_LName: '',
        Chapter: '',
      });
    }
    match = rowPattern.exec(html);
  }
  return results;
}

export async function searchGazette(params: {
  keyword?: string;
  chapter?: string;
  docType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ results: SearchResult[]; total: number }> {
  const url = buildSearchUrl(params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`公報搜尋錯誤: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const results = parseSearchResults(html);

  // Try to extract total count from HTML
  const totalMatch = html.match(/共\s*(\d[\d,]*)\s*筆/);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : results.length;

  return { results, total };
}

export function buildDetailUrl(metaId: string): string {
  const url = new URL(DETAIL_URL);
  url.searchParams.set('metaid', metaId);
  return url.toString();
}

export function parseDetailPage(html: string, metaId: string): GazetteDetail {
  // Extract title
  const titleMatch = html.match(/<h[1-4][^>]*>([^<]+)<\/h[1-4]>/i);
  const title = titleMatch ? stripHtmlTags(titleMatch[1]) : '';

  // Extract content from main content area
  const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const rawContent = contentMatch ? contentMatch[1] : '';
  const content = stripHtmlTags(rawContent).replace(/\s+/g, ' ').trim();

  // Extract agency
  const agencyMatch = html.match(/發布機關[：:]\s*([^<\n]+)/i);
  const pubGovName = agencyMatch ? stripHtmlTags(agencyMatch[1]) : '';

  // Extract date
  const dateMatch = html.match(/發布日期[：:]\s*([^<\n]+)/i);
  const datePublished = dateMatch ? stripHtmlTags(dateMatch[1]) : '';

  // Extract gazette ID
  const idMatch = html.match(/字\s*號[：:]\s*([^<\n]+)/i);
  const gazetteId = idMatch ? stripHtmlTags(idMatch[1]) : '';

  // Extract doc type
  const typeMatch = html.match(/類\s*型[：:]\s*([^<\n]+)/i);
  const docType = typeMatch ? stripHtmlTags(typeMatch[1]) : '';

  // Extract chapter
  const chapterMatch = html.match(/篇\s*別[：:]\s*([^<\n]+)/i);
  const chapter = chapterMatch ? stripHtmlTags(chapterMatch[1]) : '';

  return {
    MetaId: metaId,
    Title: title,
    PubGovName: pubGovName,
    Date_Published: datePublished,
    GazetteId: gazetteId,
    Doc_Style_LName: docType,
    Chapter: chapter,
    Content: content,
  };
}

export async function fetchGazetteDetail(metaId: string): Promise<GazetteDetail> {
  const url = buildDetailUrl(metaId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`公報詳細資料錯誤: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return parseDetailPage(html, metaId);
}

export function buildDraftUrl(page: number = 1, pageSize: number = 10): string {
  const url = new URL(DRAFT_URL);
  url.searchParams.set('action', 'doChangePage');
  url.searchParams.set('pageNum', String(page));
  url.searchParams.set('eachpage', String(pageSize));
  return url.toString();
}

export function parseDraftResults(html: string): DraftRegulation[] {
  const results: DraftRegulation[] = [];
  const rowPattern = /metaid=(\d+)[^>]*>([^<]*)</gi;
  let match = rowPattern.exec(html);
  while (match) {
    const metaId = match[1];
    const title = stripHtmlTags(match[2]).trim();
    if (metaId && title) {
      results.push({
        MetaId: metaId,
        Title: title,
        PubGovName: '',
        Date_Published: '',
        Comment_Deadline: '',
      });
    }
    match = rowPattern.exec(html);
  }
  return results;
}

export async function fetchDraftRegulations(
  page: number = 1,
  pageSize: number = 10
): Promise<{ drafts: DraftRegulation[]; total: number }> {
  const url = buildDraftUrl(page, pageSize);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`草案預告錯誤: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const drafts = parseDraftResults(html);

  const totalMatch = html.match(/共\s*(\d[\d,]*)\s*筆/);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : drafts.length;

  return { drafts, total };
}
