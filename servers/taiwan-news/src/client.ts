import type { NewsItem, FeedSource } from './types.js';

export const FEED_SOURCES: FeedSource[] = [
  {
    id: 'cna',
    name: '中央社',
    categories: {
      politics: 'https://feeds.feedburner.com/rsscna/politics',
      international: 'https://feeds.feedburner.com/rsscna/intworld',
      finance: 'https://feeds.feedburner.com/rsscna/finance',
      technology: 'https://feeds.feedburner.com/rsscna/technology',
      society: 'https://feeds.feedburner.com/rsscna/social',
      sports: 'https://feeds.feedburner.com/rsscna/sport',
      entertainment: 'https://feeds.feedburner.com/rsscna/stars',
      lifestyle: 'https://feeds.feedburner.com/rsscna/lifehealth',
      culture: 'https://feeds.feedburner.com/rsscna/culture',
      local: 'https://feeds.feedburner.com/rsscna/local',
    },
  },
  {
    id: 'ltn',
    name: '自由時報',
    categories: {
      all: 'https://news.ltn.com.tw/rss/all.xml',
      politics: 'https://news.ltn.com.tw/rss/politics.xml',
      society: 'https://news.ltn.com.tw/rss/society.xml',
      international: 'https://news.ltn.com.tw/rss/world.xml',
      finance: 'https://news.ltn.com.tw/rss/business.xml',
      lifestyle: 'https://news.ltn.com.tw/rss/life.xml',
      sports: 'https://news.ltn.com.tw/rss/sports.xml',
      entertainment: 'https://news.ltn.com.tw/rss/entertainment.xml',
      local: 'https://news.ltn.com.tw/rss/local.xml',
    },
  },
  {
    id: 'pts',
    name: '公視新聞',
    categories: {
      all: 'https://about.pts.org.tw/rss/XML/newsfeed.xml',
    },
  },
  {
    id: 'storm',
    name: '風傳媒',
    categories: {
      all: 'https://www.storm.mg/feed',
    },
  },
  {
    id: 'newslens',
    name: '關鍵評論網',
    categories: {
      all: 'https://feeds.feedburner.com/TheNewsLens',
    },
  },
];

function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(
    new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`)
  );
  if (cdataMatch) return cdataMatch[1].trim();

  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : '';
}

export function parseRssXml(
  xml: string,
  sourceId: string,
  category: string
): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');

    if (title && link) {
      items.push({
        title,
        link,
        description: description.replace(/<[^>]+>/g, '').slice(0, 200),
        pubDate,
        source: sourceId,
        category,
      });
    }
  }

  return items;
}

export async function fetchFeed(
  url: string,
  sourceId: string,
  category: string
): Promise<NewsItem[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`RSS fetch error (${sourceId}): ${response.status}`);
  }
  const xml = await response.text();
  return parseRssXml(xml, sourceId, category);
}

export async function fetchMultipleFeeds(
  feeds: Array<{ url: string; sourceId: string; category: string }>
): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    feeds.map((f) => fetchFeed(f.url, f.sourceId, f.category))
  );

  const items: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      items.push(...r.value);
    }
  }

  return items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
