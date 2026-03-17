import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FEED_SOURCES, parseRssXml, fetchFeed, fetchMultipleFeeds } from '../src/client.js';

describe('FEED_SOURCES', () => {
  it('has 5 sources', () => {
    expect(FEED_SOURCES).toHaveLength(5);
  });

  it('each source has id, name, and categories', () => {
    for (const source of FEED_SOURCES) {
      expect(source.id).toBeTruthy();
      expect(source.name).toBeTruthy();
      expect(Object.keys(source.categories).length).toBeGreaterThan(0);
    }
  });

  it('includes CNA with multiple categories', () => {
    const cna = FEED_SOURCES.find((s) => s.id === 'cna');
    expect(cna).toBeTruthy();
    expect(cna!.categories.politics).toContain('feedburner');
    expect(Object.keys(cna!.categories).length).toBeGreaterThanOrEqual(5);
  });

  it('includes LTN with all feed', () => {
    const ltn = FEED_SOURCES.find((s) => s.id === 'ltn');
    expect(ltn).toBeTruthy();
    expect(ltn!.categories.all).toContain('ltn.com.tw');
  });
});

describe('parseRssXml', () => {
  const sampleRss = `
    <rss version="2.0">
      <channel>
        <title>Test Feed</title>
        <item>
          <title>新聞標題一</title>
          <link>https://example.com/1</link>
          <description>新聞描述一</description>
          <pubDate>Tue, 17 Mar 2026 18:00:00 +0800</pubDate>
        </item>
        <item>
          <title>新聞標題二</title>
          <link>https://example.com/2</link>
          <description><![CDATA[<p>CDATA 描述</p>]]></description>
          <pubDate>Tue, 17 Mar 2026 17:00:00 +0800</pubDate>
        </item>
      </channel>
    </rss>`;

  it('parses RSS items correctly', () => {
    const items = parseRssXml(sampleRss, 'test', 'all');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('新聞標題一');
    expect(items[0].link).toBe('https://example.com/1');
    expect(items[0].description).toBe('新聞描述一');
    expect(items[0].source).toBe('test');
    expect(items[0].category).toBe('all');
  });

  it('handles CDATA descriptions', () => {
    const items = parseRssXml(sampleRss, 'test', 'all');
    expect(items[1].description).toBe('CDATA 描述');
  });

  it('strips HTML tags from description', () => {
    const xml = `<item><title>T</title><link>http://x.com</link><description><b>Bold</b> text</description><pubDate></pubDate></item>`;
    const items = parseRssXml(xml, 'src', 'cat');
    expect(items[0].description).toBe('Bold text');
  });

  it('returns empty array for empty XML', () => {
    const items = parseRssXml('<rss></rss>', 'test', 'all');
    expect(items).toEqual([]);
  });

  it('skips items without title', () => {
    const xml = `<item><link>http://x.com</link><description>desc</description></item>`;
    const items = parseRssXml(xml, 'test', 'all');
    expect(items).toEqual([]);
  });

  it('truncates long descriptions to 200 chars', () => {
    const longDesc = 'A'.repeat(300);
    const xml = `<item><title>T</title><link>http://x.com</link><description>${longDesc}</description></item>`;
    const items = parseRssXml(xml, 'test', 'all');
    expect(items[0].description.length).toBe(200);
  });
});

describe('fetchFeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses RSS feed', async () => {
    const xml = `<item><title>新聞</title><link>http://x.com</link><description>desc</description><pubDate>Mon, 17 Mar 2026 10:00:00 +0800</pubDate></item>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(xml),
    }));

    const items = await fetchFeed('http://example.com/rss', 'test', 'politics');
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe('test');
    expect(items[0].category).toBe('politics');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(fetchFeed('http://example.com/rss', 'test', 'all')).rejects.toThrow('RSS fetch error');
  });
});

describe('fetchMultipleFeeds', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('merges results from multiple feeds sorted by date', async () => {
    const xml1 = `<item><title>舊</title><link>http://1.com</link><description>d</description><pubDate>Mon, 16 Mar 2026 10:00:00 +0800</pubDate></item>`;
    const xml2 = `<item><title>新</title><link>http://2.com</link><description>d</description><pubDate>Tue, 17 Mar 2026 10:00:00 +0800</pubDate></item>`;

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml1) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml2) })
    );

    const items = await fetchMultipleFeeds([
      { url: 'http://a.com', sourceId: 'a', category: 'all' },
      { url: 'http://b.com', sourceId: 'b', category: 'all' },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('新');
    expect(items[1].title).toBe('舊');
  });

  it('ignores failed feeds gracefully', async () => {
    const xml = `<item><title>OK</title><link>http://1.com</link><description>d</description><pubDate>Mon, 17 Mar 2026 10:00:00 +0800</pubDate></item>`;

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml) })
      .mockRejectedValueOnce(new Error('network'))
    );

    const items = await fetchMultipleFeeds([
      { url: 'http://a.com', sourceId: 'a', category: 'all' },
      { url: 'http://b.com', sourceId: 'b', category: 'all' },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('OK');
  });
});
