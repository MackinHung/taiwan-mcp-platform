import type { Env, ToolResult, NewsItem } from '../types.js';
import { FEED_SOURCES, fetchMultipleFeeds } from '../client.js';

function formatItem(item: NewsItem, index: number): string {
  const source = FEED_SOURCES.find((s) => s.id === item.source);
  const sourceName = source?.name ?? item.source;
  const date = item.pubDate
    ? new Date(item.pubDate).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    : '';
  return [
    `${index + 1}. ${item.title}`,
    `   來源: ${sourceName} | ${date}`,
    `   ${item.link}`,
    item.description ? `   ${item.description.slice(0, 100)}...` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function getLatestNews(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 50);

    const feeds = FEED_SOURCES.flatMap((source) => {
      const defaultCat =
        source.categories.all ?? Object.values(source.categories)[0];
      return defaultCat
        ? [{ url: defaultCat, sourceId: source.id, category: 'all' }]
        : [];
    });

    const items = await fetchMultipleFeeds(feeds);

    if (items.length === 0) {
      return { content: [{ type: 'text', text: '目前沒有可用的新聞' }] };
    }

    const top = items.slice(0, limit);
    const lines = top.map(formatItem);

    return {
      content: [
        {
          type: 'text',
          text: `最新新聞（前 ${top.length} 則）\n\n${lines.join('\n\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得最新新聞失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getNewsBySource(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const sourceId = args.source as string;
    if (!sourceId) {
      const available = FEED_SOURCES.map((s) => `${s.id}（${s.name}）`).join('、');
      return {
        content: [
          {
            type: 'text',
            text: `請提供新聞來源（source 參數）。可用來源: ${available}`,
          },
        ],
        isError: true,
      };
    }

    const source = FEED_SOURCES.find((s) => s.id === sourceId);
    if (!source) {
      const available = FEED_SOURCES.map((s) => `${s.id}（${s.name}）`).join('、');
      return {
        content: [
          { type: 'text', text: `找不到來源「${sourceId}」。可用: ${available}` },
        ],
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 15, 1), 50);
    const defaultCat =
      source.categories.all ?? Object.values(source.categories)[0];
    const feeds = defaultCat
      ? [{ url: defaultCat, sourceId: source.id, category: 'all' }]
      : [];

    const items = await fetchMultipleFeeds(feeds);
    const top = items.slice(0, limit);

    if (top.length === 0) {
      return {
        content: [{ type: 'text', text: `${source.name} 目前沒有新聞` }],
      };
    }

    const lines = top.map(formatItem);
    return {
      content: [
        {
          type: 'text',
          text: `${source.name} 最新新聞（${top.length} 則）\n\n${lines.join('\n\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得新聞失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getNewsByCategory(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const category = args.category as string;
    if (!category) {
      const cats = new Set<string>();
      for (const s of FEED_SOURCES) {
        for (const c of Object.keys(s.categories)) {
          if (c !== 'all') cats.add(c);
        }
      }
      return {
        content: [
          {
            type: 'text',
            text: `請提供分類（category 參數）。可用: ${[...cats].join('、')}`,
          },
        ],
        isError: true,
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 15, 1), 50);

    const feeds = FEED_SOURCES.flatMap((source) => {
      const url = source.categories[category];
      return url
        ? [{ url, sourceId: source.id, category }]
        : [];
    });

    if (feeds.length === 0) {
      return {
        content: [
          { type: 'text', text: `沒有來源提供「${category}」分類的新聞` },
        ],
      };
    }

    const items = await fetchMultipleFeeds(feeds);
    const top = items.slice(0, limit);

    if (top.length === 0) {
      return {
        content: [
          { type: 'text', text: `「${category}」分類目前沒有新聞` },
        ],
      };
    }

    const lines = top.map(formatItem);
    return {
      content: [
        {
          type: 'text',
          text: `${category} 新聞（${top.length} 則）\n\n${lines.join('\n\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得分類新聞失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function searchNews(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [
          { type: 'text', text: '請提供搜尋關鍵字（keyword 參數）' },
        ],
        isError: true,
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 50);

    const feeds = FEED_SOURCES.flatMap((source) => {
      const defaultCat =
        source.categories.all ?? Object.values(source.categories)[0];
      return defaultCat
        ? [{ url: defaultCat, sourceId: source.id, category: 'all' }]
        : [];
    });

    const items = await fetchMultipleFeeds(feeds);
    const matched = items.filter(
      (item) =>
        item.title.includes(keyword) || item.description.includes(keyword)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `找不到包含「${keyword}」的新聞` },
        ],
      };
    }

    const top = matched.slice(0, limit);
    const lines = top.map(formatItem);
    return {
      content: [
        {
          type: 'text',
          text: `搜尋「${keyword}」結果（${top.length} 則，共 ${matched.length} 筆）\n\n${lines.join('\n\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋新聞失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getNewsSources(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  const lines = FEED_SOURCES.map((s) => {
    const cats = Object.keys(s.categories).join('、');
    return `${s.id}（${s.name}）— 分類: ${cats}`;
  });

  return {
    content: [
      {
        type: 'text',
        text: `可用新聞來源（${FEED_SOURCES.length} 個）\n\n${lines.join('\n')}`,
      },
    ],
  };
}
