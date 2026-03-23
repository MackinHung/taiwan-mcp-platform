import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getJsonApiUrl,
  getCsvApiUrl,
  stripHtml,
  formatPublishTime,
  parseSemicolonCsv,
  fetchTradePages,
  fetchImportRegulations,
  fetchAllImportRegulations,
  fetchEcaFtaAgreements,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const samplePages = [
  {
    Id: 101,
    PageTitle: '貿易政策公告',
    PageContent: '<p>內容<b>重點</b></p>',
    PagePublishTime: '20260320150000',
    PageSummary: '摘要',
    department: '國際貿易署',
    contributor: '張三',
  },
  {
    Id: 102,
    PageTitle: '日本市場商機',
    PageContent: '<div>日本半導體需求增加</div>',
    PagePublishTime: '20260319120000',
    PageSummary: '日本商機',
    department: '駐日經貿處',
    contributor: '李四',
  },
];

const sampleCsvRegulations =
  '編號;規定事項;規定依據;規定說明\n' +
  'I01;限制進口;貿易法;需申請許可\n' +
  'I02;檢驗標準;商品檢驗法;須符合CNS標準\n';

const sampleCsvAgreements =
  '簽訂協定名稱;協定生效日期;協定夥伴國別;協定夥伴國家;協定特性\n' +
  'ECFA;2010/09/12;亞太;中國大陸;架構協定\n' +
  '台紐經濟合作協定;2013/12/01;紐澳;紐西蘭;自由貿易\n';

describe('getJsonApiUrl', () => {
  it('returns correct URL for nodeId 39', () => {
    expect(getJsonApiUrl(39)).toBe(
      'https://www.trade.gov.tw/API/Api/Get/pages?nodeid=39&openData=true'
    );
  });

  it('returns correct URL for nodeId 45', () => {
    expect(getJsonApiUrl(45)).toBe(
      'https://www.trade.gov.tw/API/Api/Get/pages?nodeid=45&openData=true'
    );
  });

  it('returns correct URL for nodeId 40', () => {
    expect(getJsonApiUrl(40)).toBe(
      'https://www.trade.gov.tw/API/Api/Get/pages?nodeid=40&openData=true'
    );
  });

  it('starts with https', () => {
    expect(getJsonApiUrl(39)).toMatch(/^https:\/\//);
  });
});

describe('getCsvApiUrl', () => {
  it('returns correct URL for given OID', () => {
    expect(getCsvApiUrl('2963FE111E70103D')).toBe(
      'https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid=2963FE111E70103D'
    );
  });

  it('starts with https', () => {
    expect(getCsvApiUrl('ABC')).toMatch(/^https:\/\//);
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('decodes &nbsp;', () => {
    expect(stripHtml('a&nbsp;b')).toBe('a b');
  });

  it('decodes &amp;', () => {
    expect(stripHtml('a&amp;b')).toBe('a&b');
  });

  it('decodes &lt; and &gt;', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
  });

  it('decodes &quot; and &#39;', () => {
    expect(stripHtml('&quot;hello&#39;')).toBe('"hello\'');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('  a   b  ')).toBe('a b');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles string with no HTML', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });
});

describe('formatPublishTime', () => {
  it('formats full datetime YYYYMMDDHHmmss', () => {
    expect(formatPublishTime('20260320150000')).toBe('2026/03/20 15:00');
  });

  it('formats date only YYYYMMDD', () => {
    expect(formatPublishTime('20260320')).toBe('2026/03/20');
  });

  it('returns empty string for empty input', () => {
    expect(formatPublishTime('')).toBe('');
  });

  it('returns raw string for short input', () => {
    expect(formatPublishTime('2026')).toBe('2026');
  });

  it('handles undefined-like empty', () => {
    expect(formatPublishTime(undefined as unknown as string)).toBe('');
  });
});

describe('parseSemicolonCsv', () => {
  it('parses semicolon-separated CSV with header', () => {
    const rows = parseSemicolonCsv(sampleCsvRegulations);
    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe('I01');
    expect(rows[0][1]).toBe('限制進口');
  });

  it('skips header row', () => {
    const rows = parseSemicolonCsv('a;b;c\n1;2;3\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(['1', '2', '3']);
  });

  it('returns empty array for header-only CSV', () => {
    expect(parseSemicolonCsv('a;b;c\n')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseSemicolonCsv('')).toEqual([]);
  });

  it('trims cell values', () => {
    const rows = parseSemicolonCsv('a;b\n  x ; y \n');
    expect(rows[0]).toEqual(['x', 'y']);
  });

  it('handles rows with fewer columns', () => {
    const rows = parseSemicolonCsv('a;b;c;d\nonly_one\n');
    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe('only_one');
  });
});

describe('fetchTradePages', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns page array on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => samplePages,
    });

    const result = await fetchTradePages(39);
    expect(result).toHaveLength(2);
    expect(result[0].PageTitle).toBe('貿易政策公告');
  });

  it('calls the correct URL with nodeId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchTradePages(45);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.trade.gov.tw/API/Api/Get/pages?nodeid=45&openData=true'
    );
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTradePages(39)).rejects.toThrow(
      'Trade API error: 500 Internal Server Error'
    );
  });

  it('throws on 404 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchTradePages(39)).rejects.toThrow(
      'Trade API error: 404 Not Found'
    );
  });

  it('returns empty array for non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const result = await fetchTradePages(39);
    expect(result).toEqual([]);
  });

  it('returns empty array for object response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'unexpected' }),
    });

    const result = await fetchTradePages(39);
    expect(result).toEqual([]);
  });

  it('handles empty array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await fetchTradePages(39);
    expect(result).toHaveLength(0);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchTradePages(39)).rejects.toThrow('Network error');
  });
});

describe('fetchImportRegulations', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches and parses industrial regulations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sampleCsvRegulations,
    });

    const result = await fetchImportRegulations('industrial');
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('industrial');
    expect(result[0].number).toBe('I01');
    expect(result[0].subject).toBe('限制進口');
  });

  it('uses correct OID for industrial', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'a;b;c;d\n',
    });

    await fetchImportRegulations('industrial');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid=2963FE111E70103D',
      { redirect: 'follow' }
    );
  });

  it('uses correct OID for agricultural', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'a;b;c;d\n',
    });

    await fetchImportRegulations('agricultural');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid=FB7B56F7A69CE4BC',
      { redirect: 'follow' }
    );
  });

  it('uses correct OID for other', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'a;b;c;d\n',
    });

    await fetchImportRegulations('other');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid=5AA966ECD020763C',
      { redirect: 'follow' }
    );
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchImportRegulations('industrial')).rejects.toThrow(
      'Import regulations API error: 503 Service Unavailable'
    );
  });

  it('handles empty CSV', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await fetchImportRegulations('industrial');
    expect(result).toEqual([]);
  });
});

describe('fetchAllImportRegulations', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches all 3 categories and merges results', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '編號;規定事項;規定依據;規定說明\nI01;工業品;法規A;說明A\n',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '編號;規定事項;規定依據;規定說明\nA01;農產品;法規B;說明B\n',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '編號;規定事項;規定依據;規定說明\nO01;其他品;法規C;說明C\n',
      });

    const result = await fetchAllImportRegulations();
    expect(result).toHaveLength(3);
    expect(result[0].category).toBe('industrial');
    expect(result[1].category).toBe('agricultural');
    expect(result[2].category).toBe('other');
  });

  it('handles one category failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '編號;規定事項;規定依據;規定說明\nI01;品;法;說\n',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '編號;規定事項;規定依據;規定說明\nO01;品;法;說\n',
      });

    await expect(fetchAllImportRegulations()).rejects.toThrow();
  });
});

describe('fetchEcaFtaAgreements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches and parses agreements CSV', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sampleCsvAgreements,
    });

    const result = await fetchEcaFtaAgreements();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('ECFA');
    expect(result[0].effectiveDate).toBe('2010/09/12');
    expect(result[0].partnerCountry).toBe('中國大陸');
    expect(result[1].name).toBe('台紐經濟合作協定');
    expect(result[1].partnerCountry).toBe('紐西蘭');
  });

  it('calls the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'a;b;c;d;e\n',
    });

    await fetchEcaFtaAgreements();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid=33D60405F3F56533',
      { redirect: 'follow' }
    );
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchEcaFtaAgreements()).rejects.toThrow(
      'ECA/FTA API error: 500 Internal Server Error'
    );
  });

  it('handles empty CSV', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await fetchEcaFtaAgreements();
    expect(result).toEqual([]);
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));
    await expect(fetchEcaFtaAgreements()).rejects.toThrow('timeout');
  });
});
