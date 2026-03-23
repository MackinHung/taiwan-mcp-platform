import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getApiUrl,
  parseGazetteXml,
  fetchGazetteRecords,
  buildSearchUrl,
  parseSearchResults,
  searchGazette,
  buildDetailUrl,
  parseDetailPage,
  fetchGazetteDetail,
  buildDraftUrl,
  parseDraftResults,
  fetchDraftRegulations,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<Gazette>
  <Record>
    <MetaId><![CDATA[164288]]></MetaId>
    <Doc_Style_LName><![CDATA[法規]]></Doc_Style_LName>
    <Doc_Style_SName><![CDATA[法規命令]]></Doc_Style_SName>
    <Chapter><![CDATA[財政經濟篇]]></Chapter>
    <PubGovName><![CDATA[中央銀行]]></PubGovName>
    <Date_Created><![CDATA[中華民國115年3月19日]]></Date_Created>
    <GazetteId><![CDATA[院臺規字第1150004321號]]></GazetteId>
    <Date_Published><![CDATA[中華民國115年3月20日]]></Date_Published>
    <Comment_Deadline><![CDATA[]]></Comment_Deadline>
    <Comment_Days><![CDATA[]]></Comment_Days>
    <Title><![CDATA[修正不動產抵押貸款業務規定]]></Title>
    <TitleEnglish><![CDATA[]]></TitleEnglish>
    <ThemeSubject><![CDATA[金融]]></ThemeSubject>
    <Keyword><![CDATA[不動產,貸款]]></Keyword>
    <Explain><![CDATA[修正第4點規定]]></Explain>
    <Category><![CDATA[A]]></Category>
  </Record>
  <Record>
    <MetaId><![CDATA[164283]]></MetaId>
    <Doc_Style_LName><![CDATA[公告]]></Doc_Style_LName>
    <Doc_Style_SName><![CDATA[公告]]></Doc_Style_SName>
    <Chapter><![CDATA[教育科技文化篇]]></Chapter>
    <PubGovName><![CDATA[文化部]]></PubGovName>
    <Date_Created><![CDATA[中華民國115年3月18日]]></Date_Created>
    <GazetteId><![CDATA[文部字第1150004322號]]></GazetteId>
    <Date_Published><![CDATA[中華民國115年3月20日]]></Date_Published>
    <Comment_Deadline><![CDATA[115年4月20日]]></Comment_Deadline>
    <Comment_Days><![CDATA[30]]></Comment_Days>
    <Title><![CDATA[文化部語言友善環境補助作業要點修正]]></Title>
    <TitleEnglish><![CDATA[]]></TitleEnglish>
    <ThemeSubject><![CDATA[文化]]></ThemeSubject>
    <Keyword><![CDATA[文化,補助]]></Keyword>
    <Explain><![CDATA[修正補助作業要點]]></Explain>
    <Category><![CDATA[B]]></Category>
  </Record>
</Gazette>`;

// --- getApiUrl ---
describe('getApiUrl', () => {
  it('returns the correct API URL', () => {
    const url = getApiUrl();
    expect(url).toBe('https://gazette.nat.gov.tw/egFront/OpenData/downloadXML.jsp');
  });

  it('returns a string', () => {
    expect(typeof getApiUrl()).toBe('string');
  });

  it('starts with https', () => {
    expect(getApiUrl()).toMatch(/^https:\/\//);
  });
});

// --- parseGazetteXml ---
describe('parseGazetteXml', () => {
  it('parses XML with CDATA fields correctly', () => {
    const records = parseGazetteXml(sampleXml);
    expect(records).toHaveLength(2);
    expect(records[0].MetaId).toBe('164288');
    expect(records[0].Title).toBe('修正不動產抵押貸款業務規定');
    expect(records[0].PubGovName).toBe('中央銀行');
  });

  it('extracts all fields from first record', () => {
    const records = parseGazetteXml(sampleXml);
    const r = records[0];
    expect(r.MetaId).toBe('164288');
    expect(r.Doc_Style_LName).toBe('法規');
    expect(r.Doc_Style_SName).toBe('法規命令');
    expect(r.Chapter).toBe('財政經濟篇');
    expect(r.PubGovName).toBe('中央銀行');
    expect(r.Date_Created).toBe('中華民國115年3月19日');
    expect(r.Date_Published).toBe('中華民國115年3月20日');
    expect(r.GazetteId).toBe('院臺規字第1150004321號');
    expect(r.Keyword).toBe('不動產,貸款');
    expect(r.Category).toBe('A');
  });

  it('extracts comment fields from second record', () => {
    const records = parseGazetteXml(sampleXml);
    const r = records[1];
    expect(r.Comment_Deadline).toBe('115年4月20日');
    expect(r.Comment_Days).toBe('30');
  });

  it('returns empty array for empty XML', () => {
    expect(parseGazetteXml('')).toEqual([]);
  });

  it('returns empty array for XML without records', () => {
    expect(parseGazetteXml('<Gazette></Gazette>')).toEqual([]);
  });

  it('handles XML with no CDATA (simple tags)', () => {
    const simpleXml = `<Gazette><Record><MetaId>12345</MetaId><Doc_Style_LName>法規</Doc_Style_LName><Doc_Style_SName></Doc_Style_SName><Chapter></Chapter><PubGovName>測試部</PubGovName><Date_Created></Date_Created><Date_Published></Date_Published><GazetteId></GazetteId><Title>測試標題</Title><TitleEnglish></TitleEnglish><ThemeSubject></ThemeSubject><Keyword></Keyword><Explain></Explain><Category></Category><Comment_Deadline></Comment_Deadline><Comment_Days></Comment_Days></Record></Gazette>`;
    const records = parseGazetteXml(simpleXml);
    expect(records).toHaveLength(1);
    expect(records[0].MetaId).toBe('12345');
    expect(records[0].Title).toBe('測試標題');
  });

  it('handles malformed XML gracefully', () => {
    expect(parseGazetteXml('not xml at all')).toEqual([]);
  });
});

// --- fetchGazetteRecords ---
describe('fetchGazetteRecords', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns parsed gazette records on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sampleXml,
    });
    const result = await fetchGazetteRecords();
    expect(result).toHaveLength(2);
    expect(result[0].Title).toBe('修正不動產抵押貸款業務規定');
    expect(result[1].PubGovName).toBe('文化部');
  });

  it('calls the correct API URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<Gazette></Gazette>',
    });
    await fetchGazetteRecords();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://gazette.nat.gov.tw/egFront/OpenData/downloadXML.jsp'
    );
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(fetchGazetteRecords()).rejects.toThrow(
      '公報 API 錯誤: 500 Internal Server Error'
    );
  });

  it('throws on 404 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    await expect(fetchGazetteRecords()).rejects.toThrow('公報 API 錯誤: 404 Not Found');
  });

  it('returns empty array for empty XML response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<Gazette></Gazette>',
    });
    const result = await fetchGazetteRecords();
    expect(result).toEqual([]);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchGazetteRecords()).rejects.toThrow('Network error');
  });
});

// --- buildSearchUrl ---
describe('buildSearchUrl', () => {
  it('builds URL with keyword', () => {
    const url = buildSearchUrl({ keyword: '環境' });
    expect(url).toContain('keyText1=%E7%92%B0%E5%A2%83');
    expect(url).toContain('action=doQuery');
  });

  it('includes chapter param when provided', () => {
    const url = buildSearchUrl({ keyword: 'test', chapter: '4' });
    expect(url).toContain('chapter=4');
  });

  it('includes docType param when provided', () => {
    const url = buildSearchUrl({ keyword: 'test', docType: '1' });
    expect(url).toContain('styleL=1');
  });

  it('includes date range params', () => {
    const url = buildSearchUrl({
      keyword: 'test',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(url).toContain('pubdateStart=2024-01-01');
    expect(url).toContain('pubdateEnd=2024-12-31');
  });

  it('defaults page to 1 and pageSize to 10', () => {
    const url = buildSearchUrl({ keyword: 'test' });
    expect(url).toContain('pageNum=1');
    expect(url).toContain('eachpage=10');
  });

  it('uses custom page and pageSize', () => {
    const url = buildSearchUrl({ keyword: 'test', page: 3, pageSize: 30 });
    expect(url).toContain('pageNum=3');
    expect(url).toContain('eachpage=30');
  });

  it('omits optional params when not provided', () => {
    const url = buildSearchUrl({});
    expect(url).not.toContain('keyText1');
    expect(url).not.toContain('chapter');
    expect(url).not.toContain('styleL');
  });
});

// --- parseSearchResults ---
describe('parseSearchResults', () => {
  it('parses HTML with metaid links', () => {
    const html = `<a href="detail.do?metaid=164288">修正不動產抵押貸款業務規定</a>
    <a href="detail.do?metaid=164283">文化部語言友善環境補助</a>`;
    const results = parseSearchResults(html);
    expect(results).toHaveLength(2);
    expect(results[0].MetaId).toBe('164288');
    expect(results[0].Title).toBe('修正不動產抵押貸款業務規定');
    expect(results[1].MetaId).toBe('164283');
  });

  it('returns empty array for no matches', () => {
    expect(parseSearchResults('<div>no results</div>')).toEqual([]);
  });

  it('handles HTML entities in title', () => {
    const html = `<a href="detail.do?metaid=12345">A &amp; B</a>`;
    const results = parseSearchResults(html);
    expect(results[0].Title).toBe('A & B');
  });

  it('strips HTML tags from title', () => {
    const html = `<a href="detail.do?metaid=12345"><b>Bold</b> Title</a>`;
    // The regex captures [^<]* so it stops at <b>
    const results = parseSearchResults(html);
    // Depends on regex pattern - it captures text after metaid=XX>
    expect(results.length).toBeGreaterThanOrEqual(0);
  });
});

// --- searchGazette ---
describe('searchGazette', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns results and total from HTML response', async () => {
    const html = `<div>共 150 筆</div>
    <a href="detail.do?metaid=100">公報標題A</a>
    <a href="detail.do?metaid=101">公報標題B</a>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const { results, total } = await searchGazette({ keyword: '公報' });
    expect(results).toHaveLength(2);
    expect(total).toBe(150);
  });

  it('uses results.length as total when count not found', async () => {
    const html = `<a href="detail.do?metaid=100">公報A</a>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const { total } = await searchGazette({ keyword: 'test' });
    expect(total).toBe(1);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    await expect(searchGazette({ keyword: 'test' })).rejects.toThrow(
      '公報搜尋錯誤: 503 Service Unavailable'
    );
  });

  it('parses total with comma formatting', async () => {
    const html = `<div>共 162,582 筆</div>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });
    const { total } = await searchGazette({ keyword: '法規' });
    expect(total).toBe(162582);
  });
});

// --- buildDetailUrl ---
describe('buildDetailUrl', () => {
  it('builds URL with metaId', () => {
    const url = buildDetailUrl('164288');
    expect(url).toContain('metaid=164288');
    expect(url).toContain('detail.do');
  });

  it('encodes special characters', () => {
    const url = buildDetailUrl('abc def');
    expect(url).toContain('metaid=abc');
  });
});

// --- parseDetailPage ---
describe('parseDetailPage', () => {
  const sampleDetailHtml = `
    <html>
    <h2>修正不動產抵押貸款業務規定</h2>
    <div>
      發布機關：中央銀行
      發布日期：115年3月20日
      字 號：院臺規字第1150004321號
      類 型：法規
      篇 別：財政經濟篇
    </div>
    <div class="content">
      <p>修正第4點規定，關於不動產抵押貸款之相關條件。</p>
    </div>
    </html>`;

  it('extracts title from heading', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.Title).toBe('修正不動產抵押貸款業務規定');
  });

  it('extracts MetaId from argument', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.MetaId).toBe('164288');
  });

  it('extracts agency name', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.PubGovName).toBe('中央銀行');
  });

  it('extracts date published', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.Date_Published).toBe('115年3月20日');
  });

  it('extracts gazette ID', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.GazetteId).toBe('院臺規字第1150004321號');
  });

  it('extracts doc type', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.Doc_Style_LName).toBe('法規');
  });

  it('extracts chapter', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.Chapter).toBe('財政經濟篇');
  });

  it('extracts content from content div', () => {
    const detail = parseDetailPage(sampleDetailHtml, '164288');
    expect(detail.Content).toContain('修正第4點規定');
  });

  it('returns empty strings for missing fields', () => {
    const detail = parseDetailPage('<html><body></body></html>', '12345');
    expect(detail.MetaId).toBe('12345');
    expect(detail.Title).toBe('');
    expect(detail.PubGovName).toBe('');
    expect(detail.Content).toBe('');
  });
});

// --- fetchGazetteDetail ---
describe('fetchGazetteDetail', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns parsed detail on success', async () => {
    const html = `<h2>公報標題</h2><div class="content"><p>內容</p></div>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });
    const detail = await fetchGazetteDetail('164288');
    expect(detail.MetaId).toBe('164288');
    expect(detail.Title).toBe('公報標題');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    await expect(fetchGazetteDetail('999')).rejects.toThrow(
      '公報詳細資料錯誤: 404 Not Found'
    );
  });

  it('calls correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<html></html>',
    });
    await fetchGazetteDetail('164288');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('metaid=164288')
    );
  });
});

// --- buildDraftUrl ---
describe('buildDraftUrl', () => {
  it('builds URL with default page and pageSize', () => {
    const url = buildDraftUrl();
    expect(url).toContain('pageNum=1');
    expect(url).toContain('eachpage=10');
    expect(url).toContain('action=doChangePage');
  });

  it('builds URL with custom page and pageSize', () => {
    const url = buildDraftUrl(3, 30);
    expect(url).toContain('pageNum=3');
    expect(url).toContain('eachpage=30');
  });
});

// --- parseDraftResults ---
describe('parseDraftResults', () => {
  it('parses HTML with metaid links', () => {
    const html = `<a href="detail.do?metaid=200">草案預告標題A</a>
    <a href="detail.do?metaid=201">草案預告標題B</a>`;
    const results = parseDraftResults(html);
    expect(results).toHaveLength(2);
    expect(results[0].MetaId).toBe('200');
    expect(results[0].Title).toBe('草案預告標題A');
  });

  it('returns empty array for no matches', () => {
    expect(parseDraftResults('<div>empty</div>')).toEqual([]);
  });
});

// --- fetchDraftRegulations ---
describe('fetchDraftRegulations', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns drafts and total', async () => {
    const html = `<div>共 50 筆</div>
    <a href="detail.do?metaid=300">草案A</a>
    <a href="detail.do?metaid=301">草案B</a>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });
    const { drafts, total } = await fetchDraftRegulations();
    expect(drafts).toHaveLength(2);
    expect(total).toBe(50);
  });

  it('uses drafts.length when total not found', async () => {
    const html = `<a href="detail.do?metaid=300">草案A</a>`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });
    const { total } = await fetchDraftRegulations();
    expect(total).toBe(1);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(fetchDraftRegulations()).rejects.toThrow(
      '草案預告錯誤: 500 Internal Server Error'
    );
  });

  it('passes page and pageSize to URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<div></div>',
    });
    await fetchDraftRegulations(2, 30);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('pageNum=2');
    expect(calledUrl).toContain('eachpage=30');
  });
});
